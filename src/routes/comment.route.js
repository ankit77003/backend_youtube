import { Router } from "express";
// import { getVideoComments } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComments,getVideoComments,updateComment,deleteComments } from "../controllers/comment.controller.js";


const router=Router()


router.route("/add-comment/:videoId").post(verifyJWT,addComments);
router.route("/getVideoComment/:videoId").get(verifyJWT,getVideoComments);
router.route("/update-comments/:commentId").patch(verifyJWT,updateComment)
router.route("/delete-comment/:commentId").patch(verifyJWT,deleteComments)


export default router