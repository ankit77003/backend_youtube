import { toggleVidoLike,toggleCommentLike,toggleTweetLike } from "../controllers/like.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/video-like/:videoId").patch(verifyJWT,toggleVidoLike);
router.route("/comment-like/:commentId").patch(verifyJWT,toggleCommentLike);
router.route("/tweet-like/:tweetId").patch(verifyJWT,toggleTweetLike);


export default router