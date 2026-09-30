const mongoose=require("mongoose");
require("dotenv").config();

const dbconnect = async()=>{
    try{
        const connect =  mongoose.connect(process.env.MONGO_URI);
        console.log(`db connected succefully`);
    }
    catch{
        console.log(`error connecting database`);
    }
}

module.exports=dbconnect;