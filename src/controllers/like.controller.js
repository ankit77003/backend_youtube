import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";


//1. toggle like on video
const toggleVidoLike=asyncHandler(async(req,res)=>{
    //toggling on which video
    const {videoId}=req.params;
    const userId=req.user._id;
    if(!videoId){
        throw new apiError(400, "Invalid vido id")
    }
    if(!userId){
        throw new apiResponse(401, "login first")
    }
    //check it's liked or not
    const isLiked=await Like.findOne({video: videoId,likedBy: userId});
    //if both exist means allready likes-> unlike the vidoe
    if(isLiked){
        await Like.findByIdAndDelete(isLiked._id);

        return res
        .status(200)
        .json(new apiResponse(200,{isLiked:false}, "video unlike Successfully"))
    }
    //if not matches means not liked yet -->like
    else{
        await Like.create({video:videoId, likedBy:userId})

        return res
        .status(200)
        .json(new apiResponse(200,{isLiked:true}, "like video successfully"))
    }
})

//2. toggle like on comment
const toggleCommentLike=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const userId=req.user?._id;
    if(!commentId){
        throw new apiError(401,"Invalid comment id");
    }
    if(!userId){
        throw new apiError(401,"Login first");
    }
    //check for user liked or not
    const isLiked=await Like.findOne({comment: commentId,likedBy:userId});

    //if liked mark to unlike
    if(isLiked){
        await Like.findByIdAndDelete(isLiked._id);

        return res
        .status(200)
        .json(new apiResponse(200, {isLiked:false}, "video unliked successfully"));
    }
    else{
        await Like.create({comment:commentId,likedBy:userId});

        return res
        .status(200)
        .json(new apiResponse(200, {isLiked:true}, "video liked successfully"));
    }
})

//3. toggle like on tweet
const toggleTweetLike=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params;
    const userId=req.user?._id;
    if(!tweetId){
        throw new apiError(401,"invalid tweet id");
    }
    if(!userId){
        throw new apiError(401,"login first");
    }
    const isLiked=await Like.findOne({tweet: tweetId, likedBy: userId});
    if(isLiked){
        await Like.findByIdAndDelete(isLiked._id);

        return res
        .status(200)
        .json(new apiResponse(200,{isLiked:false},"tweet unliked successfully"));
    }
    else{
        await Like.create({tweet:tweetId, likedBy: userId});

        return res
        .status(200)
        .json(new apiResponse(200,{isLiked:true}, "tweet like successfuly"));
    }
})


//4. get all liked videos




export{toggleVidoLike,toggleCommentLike,toggleTweetLike}