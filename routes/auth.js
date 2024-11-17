const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const crypto = require('crypto');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('QR code:', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

client.initialize();

// Generate random OTP
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

// Send OTP to phone
function sendOtp(phoneNumber, otp) {
    const chatId = `${phoneNumber}@c.us`;
    const message = `Your OTP is ${otp}. It will expire in 5 minutes.`;
    
    return client.sendMessage(chatId, message);
}

// Request OTP
router.post('/request-otp', async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required.' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

    try {
        let user = await User.findOneAndUpdate(
            { phoneNumber },
            { otp, otpExpires, verified: false },
            { upsert: true, new: true }
        );

        await sendOtp(phoneNumber, otp);

        res.status(200).json({ message: 'OTP sent successfully.', userId: user._id });
    } catch (error) {
        res.status(500).json({ error: 'Error sending OTP.', details: error.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required.' });
    }

    try {
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (user.otp !== otp || user.otpExpires < new Date() ) {
            return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }

        user.verified = true;
        user.otp = null; // Clear OTP after successful verification
        user.otpExpires = null;
        await user.save();

        res.status(200).json({ message: 'OTP verified successfully.', userId: user._id });
    } catch (error) {
        res.status(500).json({ error: 'Error verifying OTP.', details: error.message });
    }
});

module.exports = router;
