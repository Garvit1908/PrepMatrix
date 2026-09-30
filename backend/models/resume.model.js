const mongoose = require("mongoose");

const Resumeschema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true
    },
    filename:{
        type:String,
        required:true,
        trim:true
    },
    filesize:{
        type:Number,
        required:true
    },
    rawText:{
        type:String,
        required:true
    },
        parsedData: {
        personalInfo: {
            name: String,
            email: String,
            phone: String,
            location: String,
            linkedin: String,
            github: String
        },
        summary: String,
        skills: {
            technical: [String],
            soft: [String],
            tools: [String]
        },
        experience: [{
            title: String,
            company: String,
            duration: String,
            description: String
        }],
        education: [{
            degree: String,
            institution: String,
            year: String
        }],
        projects: [{
            title: String,
            description: String,
            techStack: [String]
        }]
    },
        atsScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    targetJobDescription: {
        type: String,
        default: null
    }
},{ timestamps:true });

const Resume = mongoose.model("Resume",Resumeschema);
module.exports = Resume;