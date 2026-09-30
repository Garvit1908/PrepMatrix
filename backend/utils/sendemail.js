const { Resend } = require("resend");
require("dotenv").config();

// 1. Resend Client initialize karo
const resend = new Resend(process.env.RESEND_API_KEY);

const sendemail = async({to,subject,html}) => {      
            const {data,error} = await resend.emails.send({
            from:process.env.EMAIL_FROM || "onboarding@resend.dev",
            to,
            subject,
            html
        });

        if(error){
            console.error("Resend API error:", error);
            throw new Error(error.message || "Email delivery failed");
        }

        return data;
    
}

module.exports = sendemail;
