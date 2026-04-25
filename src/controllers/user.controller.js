import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadResult } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
// import { upload } from "../middlewares/multer.middleware.js";

const generateAccessAndRefreshTokens=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken=refreshToken;
       await user.save({validateBeforeSave:false})

       return {accessToken,refreshToken};

    }catch(err){
        throw new apiError(500, "Something went wrong while generating access and refresh tokens");
    }
}

const registerUser=asyncHandler(async(req,res)=>{

    //getting user details from frontend ...
    const {fullname,email,username,password}=req.body;
    console.log("fullname: ", fullname,  "email is: ", email, "password: ",password);

    //validation of details ...
    if([fullname, email, username, password].some((field)=>{
        return field?.trim()==="";
    })){
        //not details are not filled
        throw new apiError(400, "must filled all details")
    }

    //check user already exist or not (username and email)
    const existeduser= await User.findOne({
        $or:[{username}, {email}]
    })
    if(existeduser){
        throw new apiError(409, "user is existed, try with another")
    }
    console.log(req.files);
    //check for images,check for avatar
   
    const avatarLocalPath=req.files?.avatar?.[0]?.path;
    const coverImageLocalPath=req.files?.coverImage?.[0]?.path;
    if(!avatarLocalPath){
        throw new apiError(400, "avatar is required");
    }

     //at last upload all to cloudinary(files)
     const uploadedAvatar=await uploadResult(avatarLocalPath);
     const uploadedCoverImage=await uploadResult(coverImageLocalPath);

     //if not uploaded on cloudinary throw error
     if(!uploadedAvatar){
        throw new apiError(400, "avatar is required");
     }

     //create user object -->create entry in db
    const user= await User.create({
        fullname,
        avatar:uploadedAvatar.secure_url,
        coverImage: uploadedCoverImage?.secure_url || "",
        email,
        username: username.toLowerCase(),
        password
     })

     //check for user creation (created or not)
     const createrUserInDb=await User.findById(user._id).select("-password -refreshToken");
     
     //remove password and refress token field from response
     if(!createrUserInDb){
        throw new apiError(500, "something went wrong while registering the user");
     }

     //return response (if user creater if not return err)
    return res.status(200).json(
        new apiResponse(200, createrUserInDb,"user registered successfully")
    )
})

const loginUser=asyncHandler(async(req,res)=>{
    
   

    const {email, username,password}=req.body;
    if((!email && !username) || !password){
        throw new apiError(400, "username or password is required");
    }

    //need to check email id or username (which is already present) i.e., find it
    const user=await User.findOne({
        $or: [{username}, {email}]
    })

    //if user is not found (username and email is not found)
    if(!user){
        throw new apiError(404, "user doesn't exist");
    }
    //if user is found compare password(user entered)
    const isPasswordValid=await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new apiError(401, "Invalid user credentials");
    }
    //after password matches generate and provide user access and refresh token
    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(user._id);

     //send this in cookie form
     const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

     const options={
        httpOnly: true,
        secure: true,

     }
     return res.status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken", refreshToken,options)
     .json(
        new apiResponse(
            200,{
                user:loggedInUser,accessToken,refreshToken
            },
            "user logged in Succesfully"
        )
     )

})

const logoutUser=asyncHandler(async(req,res)=>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options ={
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new apiResponse(200,{},"user logout successfuly"));
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies?.refreshToken||req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new apiError(401, "unauthorized request")
    }

       try {
         //verify the refresh token 
         const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
 
         const user= await User.findById(decodedToken?._id);
         if(!user){
             throw new apiError(401, "invalid refresh Token");
         }
 
         if(incomingRefreshToken!==user?.refreshToken){
             throw new apiError(401, "Refresh token is expired or used");
         }
         const options= {
             httpOnly:true,
             secure:true
         }
         //generate new access token
        const{accessToken, newRefreshToken}= await generateAccessAndRefreshTokens(user._id);
 
         return res
         .status(200)
         .cookie("accessToken", accessToken,options)
         .cookie("refreshToken", newRefreshToken,options)
         .json(
             new apiResponse(
                 200,
                 {accessToken,refreshToken:newRefreshToken},
                 "Access token refreshed"
             )
         )
       } catch (error) {
            throw new apiError(401, error?.message||"Invalid refresh token");
       }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;

    const user=await User.findById(req.user?._id);
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new apiError(400, "Invalid password");
    }
    //is oldpassword is matcher with user password then they can set new password
    user.password=newPassword;
    await user.save({validateBeforeSave:false});


    return res
    .status(200)
    .json(new apiResponse(200,{},"password changed successfully"));
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new apiResponse(200,req.user, "fetched user detail successfully"));

})

const updateDetails=asyncHandler(async(req,res)=>{
    const{fullname, email}=req.body;
    if(!fullname||!email){
        throw new apiError(400,"all fields are required");
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{$set:{fullname, email:email}},{new:true})
    .select("-password")

    return res
    .status(200)
    .json(new apiResponse(200, user, "accounts details updated succesfully"));
})

const updateUserAvatar= asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new apiError(400, "avatar is missing")
    }

    const avatar=await uploadResult(avatarLocalPath);

    if(!avatar.url){
        throw new apiError(400, "Error while updating avatar");
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{avatar:avatar.url}},
        {new:true}
    ).select("-password");

    return res
    .status(200)
    .json(new apiResponse(200,user,"avatar updated successfully"));
})

const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
        throw new apiError(400,"cover image is missing");
    }
    const coverImage=await uploadResult(coverImageLocalPath);
    if(!coverImage.url){
        throw new apiError(400, "Error while update cover image");
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password");

    return res
    .status(200)
    .json(new apiResponse(200,user,"cover image updated succesfully"));
})

const getChannelProfile=asyncHandler(async(req,res)=>{
    const{username}=req.params
    if(!username?.trim()){
        throw new apiError(400, "username is missing");
    }


    const channel=await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
               from: "subscriptions" ,
               localField: "_id",
               foreignField: "channel",
               as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions" ,
               localField: "_id",
               foreignField: "subscriber",
               as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount:1,
                channelSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,


            }
        }

    ])

    if(!channel?.length){
        throw new apiError(404, "channel doesn't exist");
    }

    return res
    .status(200)
    .json(new apiResponse(200,channel[0], "user channel fetched successfully"));
})

const userWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        user: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }

                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new apiResponse(200,user[0].watchHistory,"watch history fetched successfully"));

})






export{registerUser,loginUser, logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser, updateDetails,updateUserAvatar,updateCoverImage,userWatchHistory,getChannelProfile};