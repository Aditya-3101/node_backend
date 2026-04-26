import mongoose, { isValidObjectId } from 'mongoose'
import {Like} from '../models/like.model.js'
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getVideoById } from './video.controller.js'

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

    if(!video){
        throw new ApiError(404,"video not found")
    }

    if(!loggedInUser){
        throw new ApiError(400,"user didn't logged in")
    }

    const deleteLike = await Like.findOneAndDelete({
        likedBy:loggedInUser,
        video:videoId
    })

    if(!deleteLike){
       const updateLike = await Like.create({
         likedBy:loggedInUser,
         video:videoId
     })    
    }

    const likeCount = await Like.countDocuments({video:videoId})

    const likedByUser = !deleteLike

    return res.status(200).json(
        new ApiResponse(200, {
          likeCount,
          likedByUser
        }, "Like toggled successfully")
      )

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
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"post/tweet is not valid :(")

    }

    // if(!tweetId?.trim()){
    //     throw new ApiError(400,"post/tweet is not valid :(")
    // }

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
        },
        {
            $project:{
                _id:1,
                likedVideo:1
            }
        },
        {
            $unwind: "$likedVideo"
        },
    ])

    return  res
    .status(200)
    .json(new ApiResponse(200,likedVideos,"Liked videos fetched successfully"))
})

const getvideoLikes = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    const result = await Like.findOne({video:videoId}).countDocuments()

    if(!result){
        throw new ApiError(500,"something went wrong while fetching likes")
    }

    return res.status(200).json(new ApiResponse(200,result,"fetched video likes count"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getvideoLikes,
}