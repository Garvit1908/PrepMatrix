/**
 * Zero-dependency In-Memory Sliding-Window Rate Limiter Middleware
 * Protects auth, OTP, and password reset endpoints from brute force and denial-of-wallet email attacks.
 */
const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 5, message = "Too many requests. Please try again later." }) => {
    const hits = new Map();

    return (req, res, next) => {
        // Identify client by IP (handles reverse proxies & localhost)
        const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
        const now = Date.now();
        const clientData = hits.get(ip) || { count: 0, resetTime: now + windowMs };

        // Window expired? Reset count!
        if (now > clientData.resetTime) {
            clientData.count = 1;
            clientData.resetTime = now + windowMs;
        } else {
            clientData.count += 1;
        }

        hits.set(ip, clientData);

        // Memory cleanup: purge expired IPs if map grows large
        if (hits.size > 2000) {
            for (const [key, val] of hits.entries()) {
                if (now > val.resetTime) hits.delete(key);
            }
        }

        // Limit exceeded? Block!
        if (clientData.count > max) {
            const retryAfterSec = Math.ceil((clientData.resetTime - now) / 1000);
            res.setHeader("Retry-After", retryAfterSec);
            return res.status(429).json({
                success: false,
                message: `${message} Please try again in ${retryAfterSec} seconds.`
            });
        }

        next();
    };
};

// 1. General Auth Limiter (Signup / Login: 10 requests per 15 minutes)
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many authentication attempts."
});

// 2. OTP Limiter (Verify / Resend OTP: 5 requests per 10 minutes)
const otpLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: "Too many OTP requests."
});

// 3. Forgot Password Limiter (Resend Email Quota Protection: 3 requests per 15 minutes)
const forgotPasswordLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: "Too many password reset requests."
});

module.exports = {
    authLimiter,
    otpLimiter,
    forgotPasswordLimiter
};
