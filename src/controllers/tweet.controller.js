import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";


//1.create tweet
const createTweet=asyncHandler(async(req,res)=>{
    const content=req.body.content;
    const userId=req.user?._id;
    if (!req.user || !req.user._id) {
    throw new apiError(401, "Login First");
}
    if(!content||content.trim()===""){
        throw new apiError(401, "must have message to post")
    }
    const post=await Tweet.create({
        content:content,
        owner: userId,
    })
   
    return res
    .status(200)
    .json(new apiResponse(200,post,"tweet posted successfully"));
})
//2. update tweet
//3. get users tweet
//34 delete tweet


export{createTweet}
