const express=require("express");
const app=express();
require("dotenv").config();
const dbconnect=require("./config/db");

const PORT=process.env.PORT||4000;


const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth.route");
app.use("/api/v1/auth", authRouter);

const resumeRouter = require("./routes/resume.route");
app.use("/api/v1/resume", resumeRouter);


// Centralized Global Error Handler (Express Safety Net: prevents internal leaks in production)
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err);
    return res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === "production" 
            ? "Internal server error" 
            : (err.message || "Internal server error")
    });
});





dbconnect()
.then(()=>{
    app.listen(PORT,()=>{
    console.log(`server is listening at ${PORT}`);
    })
})
.catch((err)=>{
    console.log(`error connecting db ${err}`);
})