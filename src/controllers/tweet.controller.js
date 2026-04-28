import { isValidObjectId} from "mongoose";
import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTweet = asyncHandler(async(req,res)=>{
    const {post} = req.body;

    if(!post?.trim()){
        throw new ApiError(400,"no post/tweet found")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(401,"user didn't logged in")
    }

    const createPost = await Tweet.create({
        owner:loggedInUser,
        content:post
    })

    if(!createPost){
        throw new ApiError(500,"something went wrong while posting a tweet :(")
    }

    return res.status(201)
    .json( new ApiResponse(201,createPost,"new tweet/post uploaded sucessfully"))
})

const deleteTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(400,"invalid tweet id")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(400,"user didn't logged in")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet){
        throw new ApiError(500,"something went wrong while deleting tweet/post")
    }

    return res.status(200).json(new ApiResponse(200,deletedTweet,"Tweet/post has been deleted successfully"))
})

const getUserTweets = asyncHandler(async(req,res)=>{
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid user id")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(401,"user has not logged in")
    }

    const userTweets2 = await Tweet.aggregate([
        {
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        }
    },
    {
        $sort:{
            createdAt:-1
        }
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"tweet",
            as:"tweet_likes"
        }
    },
    {
        $addFields:{
            likeCount:{$size:"$tweet_likes"},
            isLiked: {
                $in: [new mongoose.Types.ObjectId(userId), "$tweet_likes.likedBy"]
            }
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"user_detail"
        }
    },
    {
        $project:{
            _id:1,
            content:1,
            likeCount:1,
            isLiked:1,
            createdAt:1,
            avatar:{$first:"$user_detail.avatar"},
            username:{$first:"$user_detail.username"}
        }
    }
    ])

    if(!userTweets2){
        throw new ApiError(500,"Internal server Error")
    }

    return res.status(200)
    .json(new ApiResponse(200,userTweets2,"users posts fetched sucessfully"))
})

const updateTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params

    const {post} = req.body

    if(!tweetId||!post?.trim()){
        throw new ApiError(400,"invalid tweet id/post")
    }

    const loggedInUser = req.user?._id;

    if(!loggedInUser){
        throw new ApiError(401,"user didn't logged in")
    }

    const updateTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:post
            }
        },
        {new:true}
    )

    if(!updateTweet){
        throw new ApiError(500,"something went wrong while update the post/tweet")
    }

    return res.status(200).json(new ApiResponse(200,updateTweet,"post/tweet has been updated successfully"))
})

export {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
}