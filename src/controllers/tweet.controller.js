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
const updateTweet=asyncHandler(async(req,res)=>{
    const tweetId=req.params.tweetId;
    const userId=req.user._id; //set by auth.middleware.js to give if login then id
    const updatedTweet=req.body.content;
    if(!tweetId){
        throw new apiError(401, "not post found to update");
    }
    if(!userId){
        throw new apiResponse(401,"login first");
    }
    //get the tweet posted by the user and modify if matches
    const postedTweet=await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                _id:new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField:"_id",
                as: "tweetDetails",
                //fetching users details
                pipeline: [
                    {
                        $project: {
                            username: 1, fullname:1, 
                            email: 1,
                        }
                    },
                   
                ]
            }
        },
    ])
    await Tweet.updateOne(
        {
            _id:new mongoose.Types.ObjectId(tweetId),
            owner: new mongoose.Types.ObjectId(userId),
        },
       { $set: {content: updatedTweet}}
    

    )
    return res
    .status(200)
    .json(new apiResponse(200,updatedTweet,"updated tweet successfully"));
    

})

//3. get users tweet
const getUserTweets=asyncHandler(async(req,res)=>{
    const userId=req.user._id;
    if(!userId){
        throw new apiError(401,"login first");
    }
    const userTweets=await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                content: {$exists:true, $ne:null},
            }
        },
        {
            $lookup: {
                from: "users",
                localField:"owner",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {

                        $project:{username:1, email:1,fullname:1},
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new apiResponse(200,userTweets,"User all tweet fetched successfully"))
})

//34 delete tweet
const deleteUserTweets=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params;
    if(!tweetId){
        throw new apiError(401,"not comment found");
    }
    const deleteTweet=await Tweet.findByIdAndDelete(tweetId);
    if(!deleteTweet){
        throw new apiError(404, "tweet not found");
    }
    return res
    .status(200)
    .json(new apiResponse(200, deleteTweet, "successfully delete the tweet"));
})


export{createTweet,updateTweet,getUserTweets,deleteUserTweets}
