import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {Subscription} from "../models/subscription.js"
import mongoose, { Mongoose } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!channelId){
        throw new ApiError(404,"invalid channel id")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(401,"User didn't logged in")
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404,"channel doesn't exist")
    }

    const subscriptionStatus = await Subscription.findByIdAndDelete({
        subscriber:loggedInUser,
        channel:channel
    })

    if(subscriptionStatus){
        return res.status(200).json(new ApiResponse(200,"You have unsubscribed the channel"))
    }

    if(!subscriptionStatus){
        const updateSubscriptionStatus = await Subscription.create({
            subscriber:loggedInUser,
            channel:channel
        })

        if(!updateSubscriptionStatus){
            throw new ApiError(500,"Something went wrong :(")
        }

        return res.status(200)
        .json(new ApiResponse(200,updateSubscriptionStatus,"You have subscribed the channel :)"))
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(404,"invalid channel id")
    }

    const loggedInUser = req.user._id

    if(!loggedInUser){
        throw new ApiError(404,"user didn't logged in")
    }

    const checkSubscription=await User.findById(channelId)

    if(!checkSubscription){
        throw new ApiError(404,"No channel found")
    }

    const result = checkSubscription.subscriber

    return res.status(200).json(new ApiResponse(200,result,"fetched channel subscribers"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    //In above algo(getUserChannelSubscribers) replace subsciber with channel and channel with subscriber

    if(!subscriberId){
        throw new ApiError(400,"Invalid Subscriber id")
    }

    const loggedInUser = req.user?._id;

    if(!loggedInUser){
        throw new ApiError(404,"user didn't logged in")
    }

    const result = await Subscription.aggregate([
        {
            $match:{
               subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedTo"
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200,result[0],"user's subscribed channels"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}