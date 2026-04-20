import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser,changeCurrentPassword,getCurrentUser,updateDetails,updateUserAvatar,updateCoverImage,getChannelProfile,userWatchHistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)


router.route("/login").post(loginUser)

//secured route             //middleware(before logout user existence)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-details").patch(verifyJWT,updateDetails)
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/update-coverImage").path(verifyJWT,upload.single("/coverImage"),updateCoverImage)
router.route("/c/:channelProfile").get(verifyJWT,getChannelProfile)
router.route("/user-watchHistory").get(verifyJWT,userWatchHistory)







export default router