const mongoose = require('mongoose');


// Function to get the current date in the desired format
function getCurrentDate() {
    const currentDate = new Date();
    return (
        currentDate.getDate() +
        "/" +
        (currentDate.getMonth() + 1) +
        "/" +
        currentDate.getFullYear()
    );
}
// Function to get the current time in the desired format
function getCurrentTime() {
    const currentDate = new Date();
    return (
        currentDate.getHours() +
        ":" +
        currentDate.getMinutes() +
        ":" +
        currentDate.getSeconds()
    );
}


const userSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, unique: true },
    otp: { type: String},
    otpExpires: { type: Date },
    verified: { type: Boolean, default: false },
    date: {
        type: String,
        default: getCurrentDate,
    },
    time: {
        type: String,
        default: getCurrentTime,
    },
});

module.exports = mongoose.model('User', userSchema);
