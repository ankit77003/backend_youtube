import { Router } from "express";
import { createTweet,updateTweet,getUserTweets,deleteUserTweets } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router=Router();


router.route("/post-tweet").post(verifyJWT,createTweet);

router.route('/update-tweet/:tweetId').patch(verifyJWT,updateTweet)

router.route('/get-user-tweet').get(verifyJWT,getUserTweets)

router.route('/delete-user-tweet/:tweetId').patch(verifyJWT, deleteUserTweets)


export default router

