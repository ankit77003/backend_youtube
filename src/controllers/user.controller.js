import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadResult } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import { jwt } from "jsonwebtoken";
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

export{registerUser,loginUser, logoutUser,refreshAccessToken}