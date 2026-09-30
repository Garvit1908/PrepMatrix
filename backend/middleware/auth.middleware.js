const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const verifytoken = async(req,res,next) => {
    try{
        //fetch token from request
        const token = req.cookies?.accessToken||
                      req.header("Authorization")?.replace("Bearer ","");

        if(!token){
            return res.status(401).json({
                success:false,
                message:"Unauthorized: No token provided"
            })
        }

        // 2. Token verify karo with explicit algorithm lock
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
            algorithms: ["HS256"]
        });

        // 3. User ko DB se fetch karo (bina password aur refresh token ke)
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Account is not verified"
            });
        }

        req.user = user;
        next();
    }
    catch(err){
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid or expired token"
        });
    }

}

module.exports = verifytoken;