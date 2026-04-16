import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
    subscriberCount,
    checkSubscriptionStatus
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(getSubscribedChannels)
    .post(toggleSubscription)

router.route("/check/:channelId").get(checkSubscriptionStatus)

router.route("/s/:subscriberId").get(subscriberCount);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router