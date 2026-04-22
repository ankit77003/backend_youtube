import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import apiError from "../utils/apiError.js";
import {apiResponse} from '../utils/apiResponse.js'

//add comments
const addComments=asyncHandler(async(req,res)=>{
    //on which video we're adding comment
    const{videoId}=req.params;
    //what comment we are adding
    const{content}=req.body;
    if(!content||content.length===0){
        throw new apiError(400, "comment is required");
    }
    //creating comment
    const comment=await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })
    return res
    .status(200)
    .json(new apiResponse(200,comment,"comment added successfully"));

})

//get all the comments from videos
const getVideoComments=asyncHandler(async(req,res)=>{
   const{videoId}= req.params
//    console.log(req.params)

   if(!videoId){
    throw new apiError(400,"No video Id found")
   }
   const comment=await Comment.find({video:videoId});

   if(!comment||comment.length===0){
    throw new apiError(404, "No comment found")
   }
   

   return res
   .status(200)
   .json(new apiResponse(200,comment, "comment fetched successfully"))

})

//update Comments
const updateComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    const {content}=req.body;

    if(!commentId){
        throw new apiError(400, "no comment id is found")
    }

    if(!content){
        throw new apiError(400, "comment updation is required")
    }

    const existingComment=await Comment.findByIdAndUpdate(commentId,
        {
            $set: {content}
        },
        {new: true}
    );
  
    if(!existingComment){
        throw new apiError(404, "comment not found");
    }
    return res
    .status(200)
    .json(new apiResponse(200,existingComment.content,"comment updated successfully"));
})

//delete comments
const deleteComments=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;

    if(!commentId){
        throw new apiError(400,"content id is not found")
    }

    const deleteComment=await Comment.findByIdAndDelete(commentId);

    if(!deleteComment){
        throw new apiError(404, "comment not found")
    }
    return res
    .status(200)
    .json(new apiResponse(200,deleteComment,"comment deleted successfully"))

})

//completed comment route









export {addComments,getVideoComments,updateComment,deleteComments}