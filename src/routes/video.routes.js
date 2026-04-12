import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    getVideosFromAllusers,
    getMoreVideos,
    getVideosfromSubscribedChannel
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.milddleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router.route('/all/v').get(getVideosFromAllusers)

router.route("/v/:videoId").get(getMoreVideos)
router.route("/subscriptions/v/:channelId").get(getVideosfromSubscribedChannel)

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router