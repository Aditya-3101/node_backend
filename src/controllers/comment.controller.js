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

    const getComments = await Comment.aggregate([
        {
            $match:videoId
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"video",
                as:"videoComments"
            }
        }
    ])

    if(!getComments){
        throw new ApiError(500,"something went wrong while fetching comments")
    }

    return res.status(200)
    .json(new ApiResponse(200,getComments,"comments fetched"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}