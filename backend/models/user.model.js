const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const crypto = require("crypto");

const Userschema = new mongoose.Schema({
    username: {
        type: "String",
        required: true
    },
    email: {
        type: "String",
        required: true,
        unique: true,
        trim: true,
        lowercase:true
    },
    password: {
        type: "String",
        required: function () {
        // Agar googleId nahi hai, tabhi password compulsory hai!
        return !this.googleId;
        },
        minlength: [8, "Password must be at least 8 characters"],
        select: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // 👈 YEH SABSE BADA TRAP HAI!
    },
    refreshToken: {
        type: String,
        select: false
    },
    resetPasswordToken: {
    type: String,
    select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    },
        isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        select: false 
    },
    otpExpire: {
        type: Date,
        select: false // 5m ttl
    },
    otpAttempts: {
        type: Number,
        default: 0,
        select: false // Har naye OTP cycle par 0 ho jayega
    },
    otpLastSentAt: {
        type: Date,
        select: false // 60-second cooldown 
    },
    previousRefreshToken: {
        type: String,
        select: false // Stores previous token during rotation
    },
    rotationGraceExpiresAt: {
        type: Date,
        select: false // 15-second grace window for concurrent frontend calls
    }
}, { timestamps: true })


// Password hashing before saving
Userschema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
})

// Helper method: Login ke time password match karne ke liye
Userschema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// GENERATE ACCESS TOKEN
Userschema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m"
        }
    )
}

// GENERATE REFRESH TOKEN
Userschema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d"
        }
    )
}

Userschema.methods.getResetPasswordToken = function(){
    //generate 32bytes(64char) token and store in hex string
    const resetToken=crypto.randomBytes(32).toString("hex");

    //Token ko SHA-256 se hash karke DB field me store karo
    this.resetPasswordToken=crypto.createHash("sha256").update(resetToken).digest("hex");

    //set expiry
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    //return plane token not hashed
    return resetToken;
}

const User = mongoose.model('User', Userschema);
module.exports = User;