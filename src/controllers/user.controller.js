import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser=asyncHandler(async(req,res)=>{
    res.status(200).json({
        message: "checked for first time postman"
    })
})

export{registerUser}