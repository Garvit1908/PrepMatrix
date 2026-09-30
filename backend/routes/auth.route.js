const express = require("express");
const router = express.Router();



const { 
    login, 
    signup, 
    verifyEmailOtp,
    resendOtp,
    refreshaccesstoken, 
    logout,
    forgotpassword, 
    resetpassword,
    googleLogin
} = require("../controllers/auth.controller");

const verifytoken = require("../middleware/auth.middleware");
const { authLimiter, otpLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiter.middleware");

// Public Routes (Bina login ke chalenge)
router.post('/signup', authLimiter, signup);
router.post('/verify-otp', otpLimiter, verifyEmailOtp);
router.post('/resend-otp', otpLimiter, resendOtp);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshaccesstoken);
router.post('/forgot-password', forgotPasswordLimiter, forgotpassword);
router.post('/reset-password/:token', forgotPasswordLimiter, resetpassword);
router.post('/google', googleLogin);

// Protected Route (Sirf logged-in user hi access kar sakta hai!)
router.post('/logout', verifytoken, logout);
router.get("/me", verifytoken, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Protected profile accessed successfully",
        user: req.user
    });
});

module.exports = router;
