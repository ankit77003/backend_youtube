import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import connectDB from "./db/config.js";

const app = express();

connectDB();
console.log(process.env.MONGODB_URI);





// (async() => {
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("error",(error)=>{
//         console.log("error is: ",error);
//         throw error
//        })
//        app.listen(process.env.PORT, ()=>{
//         console.log("App is listening on port ${process.env.PORT}");
//        })

//     }
//     catch(error){
//         console.error("ERROR: ",error);
//         throw error
//     }

// })()