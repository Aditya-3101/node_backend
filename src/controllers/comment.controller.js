import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId){
        throw new ApiError(400,"invalid video id")
    }

    const aggregate = Comment.aggregate([
        {
            $match: {
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"video",
                as:"videoComments"
            }
        },
        {
            $project:{
                comment:1,
                owner:1,
                createdAt:1
            }
        }
    ])

    const result = await Comment.aggregatePaginate(aggregate, {
        page: Number(page),
        limit: Number(limit)
      });

    if(!result){
        throw new ApiError(500,"something went wrong while fetching comments")
    }

    return res.status(200)
    .json(new ApiResponse(200,result,"comments fetched"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const {comment} = req.body

    const {videoId} = req.params

    if(!comment.trim() || !mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"invalid comment/video id")
    }

    const loggedInUser = req.user?._id;

    if(!loggedInUser){
        throw new ApiError(401,"user didn't logged in")
    }

    const commentAdd = await Comment.create({
        comment:comment,
        video:videoId,
        owner:loggedInUser
    })

    if(!commentAdd){
        throw new ApiError(500,"something went wrong while adding comment")
    }

    return res.status(201).json(new ApiResponse(201,commentAdd,"comment added successfully"))


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    
    const {commentId} = req.params

    const {comment} = req.body

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment id")
    }

    if(!comment?.trim()){
        throw new ApiError(400,"no comment found")
    }

    const loggedInUser = req.user?._id;

    if(!loggedInUser){
        throw new ApiError(401,"user didn't logged in")
    }

    const upComment = await Comment.findByIdAndUpdate(
        {_id:commentId,owner:loggedInUser},
        {
            $set:{
                comment:comment
            }
        },
        {
            new:true
        }
    )

    if(!upComment){
        throw new ApiError(500,"comment not found or unauthorized :(")
    }

    return res.status(200).json(new ApiResponse(200,upComment,"comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment id")
    }

    const loggedInUser = req.user?._id;

    if(!loggedInUser){
        throw new ApiError(401,"user didn't logged in")
    }

    // const checkValidComment = await Comment.findById(commentId).select("owner -_id")

    // if(checkValidComment?.owner.toString()!==loggedInUser.toString()){
    //     throw new ApiError(400,"invalid user")
    // }

    const deleteComment = await Comment.findOneAndDelete({
        _id:commentId,
        owner:loggedInUser
    })

    if(!deleteComment){
        throw new ApiError(500,"comment not found or unauthorized :(")
    }

    return res.status(200).json(new ApiResponse(200,{},"comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}