import mongoose from 'mongoose'
import {Like} from '../models/like.model.js'
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    //TODO: toggle like on video
    /*
    1- Check if videoId is valid or not
    2- If already liked then remove from database
    3- If not then add in database
    */

    if(!videoId?.trim()){
        throw new ApiError(400,"Video is not valid :(")
    }

    const loggedInUser = req.user?._id

    const video = await Video.findById(videoId)

    if(!loggedInUser){
        throw new ApiError(400,"user didn't logged in")
    }

    const checkLike = await Like.findOneAndDelete({
        likedBy:loggedInUser,
        video:video
    })

    if(checkLike){
        return res.status(200).json(new ApiResponse(200,"Like has been removed"))
    }

    if(!checkLike){
        const updateLike = await Like.create({
        likedBy:loggedInUser,
        video:video
    })

    const likedVideo = await Like.findById(updateLike._id)


    if(!likedVideo){
        throw new ApiError(503,"Something went wrong :(")
    }

    return res.status(200)
    .json(new ApiResponse(200,likedVideo,"You have liked the video :)"))

}

})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    //TODO: toggle like on video
    /*
    1- Check if commentId is valid or not
    2- If already liked then remove from database
    3- If not then add in database
    */

    if(!commentId?.trim()){
        throw new ApiError(400,"comment is not valid :(")
    }

    const loggedInUser = req.user?._id

    const comment = await Comment.findById(commentId)

    if(!loggedInUser){
        throw new ApiError(400,"user didn't logged in")
    }

    const checkComment = await Like.findOneAndDelete({
        likedBy:loggedInUser,
        comment:comment
    })

    if(checkComment){
        return res.status(200).json(new ApiResponse(200,"like has been removed from comment"))
    }

    if(!checkComment){
        const updateLike = await Like.create({
        likedBy:loggedInUser,
        comment:comment
    })

    const likeComment = await Like.findById(updateLike._id)


    if(!likeComment){
        throw new ApiError(503,"Something went wrong :(")
    }

    return res.status(200)
    .json(new ApiResponse(200,likeComment,"You have liked the comment :)"))

}
})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    //TODO: toggle like on video
    /*
    1- Check if tweetId is valid or not
    2- If already liked then remove from database
    3- If not then add in database
    */

    if(!tweetId?.trim()){
        throw new ApiError(400,"post/tweet is not valid :(")
    }

    const loggedInUser = req.user?._id

    const tweet = await Tweet.findById(tweetId)

    if(!loggedInUser){
        throw new ApiError(400,"user didn't logged in")
    }

    const checkTweet = await Like.findOneAndDelete({
        likedBy:loggedInUser,
        tweet:tweet
    })

    if(checkTweet){
        return res.status(200).json(new ApiResponse(200,"like has been removed from post"))
    }

    if(!checkTweet){
        const updateLike = await Like.create({
        likedBy:loggedInUser,
        tweet:tweet
    })

    const likeTweet = await Like.findById(updateLike._id)


    if(!likeTweet){
        throw new ApiError(503,"Something went wrong :(")
    }

    return res.status(200)
    .json(new ApiResponse(200,likeTweet,"You have liked the post :)"))

}
})

const getLikedVideos = asyncHandler(async(req,res)=>{
    const userId = req.user?._id

    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"likedVideo",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return  res
    .status(200)
    .json(new ApiResponse(200,likedVideos[0].watchHistory,"Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}