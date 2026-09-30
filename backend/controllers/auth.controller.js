const User = require("../models/user.model");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const sendEmail = require("../utils/sendemail");
const { getPasswordResetTemplate, getOtpEmailTemplate } = require("../utils/emailTemplates");

// SHA-256 hash helper for tokens (no 72-byte limit)
const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

const validatePassword = (password) => {
    if (!password || typeof password !== "string") {
        return "Password is required";
    }
    if (password.length < 8) {
        return "Password must be at least 8 characters long";
    }
    return null;
};

// Safe error message helper (prevents internal stack/system leaks in production)
const safeErrorMessage = (err, defaultMessage = "Something went wrong") => {
    return process.env.NODE_ENV === "production" ? defaultMessage : `${defaultMessage}: ${err.message}`;
};

exports.signup = async (req, res) => {
    let newUser = null;
    try {
        const { username, email, password } = req.body;

        // 1. Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email & password are required"
            });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Check if user already exists
        const isuserexist = await User.findOne({ email: normalizedEmail });
        if (isuserexist) {
            if (isuserexist.isVerified) {
                return res.status(409).json({
                    success: false,
                    message: "User already exists. Please login."
                });
            }

            // Senior Edge Case: Unverified user dobara signup kar raha hai
            // Fresh OTP generate karo, attempts 0 karo, aur resend karo
            const otp = crypto.randomInt(100000, 1000000).toString();
            isuserexist.username = username.trim();
            isuserexist.password = password; // pre-save will re-hash
            isuserexist.otp = hashToken(otp);
            isuserexist.otpExpire = Date.now() + 5 * 60 * 1000;
            isuserexist.otpAttempts = 0; // 👈 Reset attempts per cycle!
            isuserexist.otpLastSentAt = Date.now();
            await isuserexist.save();

            await sendEmail({
                to: isuserexist.email,
                subject: "PrepMatrix - Verify Your Email",
                html: getOtpEmailTemplate(isuserexist.username, otp)
            });

            return res.status(200).json({
                success: true,
                message: "Account already registered but unverified. A new verification OTP has been sent to your email."
            });
        }

        // 3. New User: Generate Crypto 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        newUser = await User.create({
            username: username.trim(),
            email: normalizedEmail,
            password,
            isVerified: false,
            otp: hashToken(otp),
            otpExpire: Date.now() + 5 * 60 * 1000, // 5 mins TTL
            otpAttempts: 0,
            otpLastSentAt: Date.now()
        });

        // 4. Send OTP via Email
        await sendEmail({
            to: newUser.email,
            subject: "PrepMatrix - Verify Your Email",
            html: getOtpEmailTemplate(newUser.username, otp)
        });

        // ✅ Notice: NO COOKIES GIVEN! Account unverified hai abhi.
        return res.status(201).json({
            success: true,
            message: "Registration successful! Please check your email for the 6-digit verification code."
        });

    } catch (err) {
        // 🚨 ROLLBACK: Agar user DB me ban gaya tha par email send fail hua, toh delete karo!
        if (newUser && newUser._id) {
            await User.findByIdAndDelete(newUser._id);
        }

        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }
        console.error("Signup error:", err);
        return res.status(500).json({
            success: false,
            message: safeErrorMessage(err, "Something went wrong")
        });
    }
};

exports.verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and 6-digit OTP are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail }).select("+otp +otpExpire +otpAttempts");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified. Please login."
            });
        }

        if (!user.otp || !user.otpExpire) {
            return res.status(400).json({
                success: false,
                message: "No active verification OTP found. Please request a new one."
            });
        }

        // 1. Expiry Check (5 Minutes)
        if (user.otpExpire < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        // 2. Brute Force Protection (Max 5 attempts)
        if (user.otpAttempts >= 5) {
            user.otp = undefined;
            user.otpExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({
                success: false,
                message: "Maximum OTP attempts exceeded. Please request a fresh OTP."
            });
        }

        // 3. Hash Check
        const hashedIncomingOtp = hashToken(otp.toString().trim());
        if (hashedIncomingOtp !== user.otp) {
            user.otpAttempts += 1;
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${5 - user.otpAttempts} attempts remaining.`
            });
        }

        // ✅ SUCCESS: Email verified! Clean up OTP cycle fields
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        user.otpAttempts = 0;

        // Auto-login: Issue Tokens & Set HTTP-Only Cookies
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = hashToken(refreshToken);
        await user.save({ validateBeforeSave: false });

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
            .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
            .json({
                success: true,
                message: "Email verified successfully! You are now logged in.",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isVerified: user.isVerified
                }
            });

    } catch (err) {
        console.error("OTP Verification error:", err);
        return res.status(500).json({
            success: false,
            message: safeErrorMessage(err, "OTP verification failed")
        });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail }).select("+otpExpire +otpLastSentAt");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified. Please login."
            });
        }

        // 60-Second Cooldown Check (Spam Prevention)
        if (user.otpLastSentAt && (Date.now() - user.otpLastSentAt) < 60 * 1000) {
            const secondsLeft = Math.ceil((60 * 1000 - (Date.now() - user.otpLastSentAt)) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${secondsLeft} seconds before requesting a new OTP.`
            });
        }

        // Generate Fresh OTP & Reset Cycle Attempts
        const otp = crypto.randomInt(100000, 1000000).toString();
        user.otp = hashToken(otp);
        user.otpExpire = Date.now() + 5 * 60 * 1000;
        user.otpAttempts = 0; // 👈 PER-CYCLE RESET!
        user.otpLastSentAt = Date.now();
        await user.save({ validateBeforeSave: false });

        await sendEmail({
            to: user.email,
            subject: "PrepMatrix - Your New Verification Code",
            html: getOtpEmailTemplate(user.username, otp)
        });

        return res.status(200).json({
            success: true,
            message: "Fresh verification code sent to your email"
        });

    } catch (err) {
        console.error("Resend OTP error:", err);
        return res.status(500).json({
            success: false,
            message: safeErrorMessage(err, "Failed to resend OTP")
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        //check for data
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email & password are required"
            })
        }

        const normalizedEmail = email.trim().toLowerCase();

        // check if user already exists or not
        const isuserexist = await User.findOne({ email: normalizedEmail }).select("+password");
        if (!isuserexist) {
            return res.status(400).json({
                success: false,
                message: "User doesn't exist"
            });
        }

        const ismatch = await isuserexist.comparePassword(password);
        if (!ismatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // 🚨 Unverified account guard
        if (!isuserexist.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in. An OTP is required."
            });
        }

        const accessToken = isuserexist.generateAccessToken();
        const refreshToken = isuserexist.generateRefreshToken();

        isuserexist.refreshToken = hashToken(refreshToken);
        await isuserexist.save();

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
            .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
            .json({
                success: true,
                message: "User logged in successfully",
                user: {
                    id: isuserexist._id,
                    username: isuserexist.username,
                    email: isuserexist.email
                }
            });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({
            success: false,
            message: safeErrorMessage(err, "Something went wrong")
        });
    }
}

exports.refreshaccesstoken = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No refresh token provided"
            });
        }

        // Fix 4: Explicit Algorithm Validation (HS256)
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET, {
            algorithms: ["HS256"]
        });

        // Fix 1: Select refreshToken, previousRefreshToken, and rotationGraceExpiresAt
        const user = await User.findById(decoded.id).select(
            "+refreshToken +previousRefreshToken +rotationGraceExpiresAt"
        );
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        const hashedIncomingToken = hashToken(incomingRefreshToken);
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        };

        // Fix 1 Logic:
        // Scenario A: Request matches current active token -> Normal rotation
        // Scenario B: Request matches previous token within 15s grace window -> Concurrent frontend call (race condition)
        // Scenario C: Request matches neither OR previous token after grace window -> Token theft / replay attack!

        const isCurrentToken = user.refreshToken && (hashedIncomingToken === user.refreshToken);
        const isGracePeriodToken =
            user.previousRefreshToken &&
            (hashedIncomingToken === user.previousRefreshToken) &&
            user.rotationGraceExpiresAt &&
            (user.rotationGraceExpiresAt > Date.now());

        if (!isCurrentToken && !isGracePeriodToken) {
            // Replay attack or token reuse outside grace period! Invalidate entire session!
            user.refreshToken = null;
            user.previousRefreshToken = null;
            user.rotationGraceExpiresAt = null;
            await user.save({ validateBeforeSave: false });

            return res
                .status(403)
                .clearCookie("accessToken", cookieOptions)
                .clearCookie("refreshToken", cookieOptions)
                .json({
                    success: false,
                    message: "Invalid refresh token: Session compromised, please login again"
                });
        }

        // Scenario B: Grace window concurrent request
        // Frontend ne simultaneously multiple API calls kiye jab token expire hua.
        // Return fresh access token without invalidating current session or double-rotating.
        if (isGracePeriodToken) {
            const freshAccessToken = user.generateAccessToken();
            return res
                .status(200)
                .cookie("accessToken", freshAccessToken, {
                    ...cookieOptions,
                    maxAge: 15 * 60 * 1000
                })
                .json({
                    success: true,
                    message: "Access token refreshed (concurrent grace window)"
                });
        }

        // Scenario A: Standard Rotation
        // Move current token to previous, set 15-second grace window, and issue new refresh token
        const newAccessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();

        user.previousRefreshToken = user.refreshToken;
        user.rotationGraceExpiresAt = Date.now() + 15 * 1000; // 15s grace window
        user.refreshToken = hashToken(newRefreshToken);
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000
            })
            .cookie("refreshToken", newRefreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            .json({
                success: true,
                message: "Access token refreshed & rotated successfully"
            });
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token"
        });
    }
};

exports.logout = async (req, res) => {
    try {
        // 1. Database me user ka refreshToken, previousRefreshToken aur grace window clear karo
        await User.findByIdAndUpdate(req.user._id, {
            $set: { 
                refreshToken: null,
                previousRefreshToken: null,
                rotationGraceExpiresAt: null
            }
        });

        // 2. Wahi exact cookie options jo login me use kiye the:
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        };

        // 3. Browser se dono cookies clear karo
        return res
            .status(200)
            .clearCookie("accessToken", cookieOptions)
            .clearCookie("refreshToken", cookieOptions)
            .json({
                success: true,
                message: "User logged out successfully"
            });

    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
            success: false,
            message: safeErrorMessage(err, "Logout failed")
        });
    }
};

exports.forgotpassword = async(req,res) =>{
    try{
        const { email } = req.body;

    //validate email
    if(!email){
        return res.status(400).json({
            success:false,
            message:"Email Required"
        })
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    //check if user exists ot not
    const user = await User.findOne({ email: normalizedEmail });
    if(!user){
        return res.status(404).json({
            success:false,
            message:"user not found"
        })
    }

    // token generate karo 
    const resetToken=user.getResetPasswordToken();

    // User document save karo
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${resetToken}`;
    const messageHtml = getPasswordResetTemplate(user.username, resetUrl);

    await sendEmail({
        to: user.email,
        subject: "PrepMatrix - Password Reset Request (Expires in 10 mins)",
        html: messageHtml
    });

        return res.status(200).json({
            success: true,
            message: "Password reset link sent to your email"
        });

    } catch (err) {
        console.error("Forgot password error:", err);

        // Safety: Agar user exist karta tha tabhi rollback karo
        if (typeof user !== "undefined" && user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
        }
        
        return res.status(500).json({
            success: false,
            message: safeErrorMessage(err, "Forgot password failed. Please try again later.")
        });
    }
}

exports.resetpassword = async(req,res) =>{
    try{
        const { token } = req.params;
        const { password } = req.body;

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        // Incoming plain token ko SHA-256 se hash karo DB me match karne ke liye
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() } // Abhi ka time expiry se chhota hona chahiye!
        }).select("+password +refreshToken");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset token"
            });
        }

        user.password = password;
        user.isVerified = true; // Email link proves ownership!

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        // Purane devices ke sessions revoke karo:
        user.refreshToken = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please login with your new password."
        });

    } catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json({
            success: false,
            message: safeErrorMessage(err, "Reset password failed")
        });
    }
};

exports.googleLogin = async(req,res) =>{
    try{
        const { idToken } = req.body;

        
        if(!idToken) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        // 1. Google ke ticket se verify karo (Signature + Audience thappa check)
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        // 2. Google ka payload nikalo
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, email_verified } = payload;

        // 🚨 Security Defense: Reject login if Google email is not verified (Account Takeover Prevention)
        if (!email_verified) {
            return res.status(403).json({
                success: false,
                message: "Google email is not verified. Please verify your email with Google first."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 3. Check karo user pehle se hai ya nahi
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // Case A: User pehle se hai (Maan lo normal password se banaya tha pehle)
            // Toh uske account me googleId link kar do!
            if (!user.googleId) {
                user.googleId = googleId;
                user.isVerified = true;
                await user.save();
            }
        } else {
            // Case B: Naya user hai (First time aaya hai Google se) ➡️ Auto-Signup!
            user = await User.create({
                username: name || normalizedEmail.split("@")[0],
                email: normalizedEmail,
                googleId,
                isVerified: true
            });
            // Password schema me conditional hai, isliye bina password ke mast save hoga!
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = hashToken(refreshToken);
        await user.save();

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        };

        return res
        .status(200)
        .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
        .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
        .json({
            success: true,
            message: "login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    }
    catch(err){
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }
        console.error("Google authentication error:", err);
        return res.status(500).json({
            success: false,
            message: safeErrorMessage(err, "Google authentication failed")
        });
    }
}