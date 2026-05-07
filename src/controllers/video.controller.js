
import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudnary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const filter = {
        isPublished:true,
    }

    const skip = (parseInt(page) - 1)*parseInt(limit)

    if(userId && !isValidObjectId(userId)){
        throw new ApiError(403,"invalid user id")
    }

    if(userId) filter.owner=userId

    if(query){
        filter.title = {$regex:query, $options:"i"}
    }

    // const sort = {
    //     [sortBy] : sortType === "asc" ? 1 : -1
    // }

    const sort = sortBy
  ? { [sortBy]: sortType === "asc" ? 1 : -1 }
  : { createdAt: -1 }

    const allVideos = await Video.find(filter).populate("owner","fullName avatar").sort(sort).skip(skip).limit(parseInt(limit))

    const allVideoCount = await Video.countDocuments(filter)

    return res.status(200).json( new ApiResponse(200,{allVideos,allVideoCount,page:parseInt(page),limit:parseInt(limit)},"videos fetched successfully"))
    
})

const getVideosFromOwnChannel = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10,userId} = req.query
    //TODO: get all videos based on query, sort, pagination
    const skip = (parseInt(page) - 1)*parseInt(limit)

    const loggedInUser = req.user

    if(!loggedInUser||!userId){
        throw new ApiError(400,"user didn't logged in")
    }

    const currentUser=userId?userId:loggedInUser

    const allVideos = await Video.find({owner:currentUser}).populate("owner", "username avatar fullName")
    .skip(skip).limit(parseInt(limit))

    const allVideoCount = await Video.countDocuments({owner:loggedInUser._id})

    return res.status(200).json( new ApiResponse(200,{allVideos,allVideoCount,page:parseInt(page),limit:parseInt(limit)},"videos fetched successfully"))
    
})

const getVideosFromAllusers = asyncHandler(async(req,res)=>{
     const loggedInUser = req.user?._id;

     const {page=1,limit=10} = req.query

     if(!loggedInUser){
        return new ApiError(400,"user didn't logged in")
     }

     const skip = (parseInt(page)-1)*(parseInt(limit))

     //const result = await Video.find().limit(25).select("-__v")

     const result = await Video.find({ isPublished: true })
     .populate("owner", "username avatar fullName")
     .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
     
     const videosCount = await Video.countDocuments()

     if(!result){
        return new ApiError(500,"something went wrong while fetching all videos")
     }

     return res.status(200).json(new ApiResponse(200,{
        result,
        videosCount:videosCount,
        page:parseInt(page),
        limit:parseInt(limit)
    },"all available videos fetched"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title?.trim()||!description?.trim()){
        throw new ApiError(400,"invalid title/description")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(400,"user didn't logged in")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoLocalPath){
        throw new ApiError(400,"video not uploaded")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail not uploaded")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile|| !thumbnail){
        throw new ApiError(500,"something went wrong while uploading the video/thumbnail :(")
    }

    const videos = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:videoFile.duration || 0,
        owner:loggedInUser  
    })

    return res.status(201).json(new ApiResponse(201,videos,"video uploaded successfully"))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(401,"User didn't logged in properly ")
    }

    const videoById = await Video.findById(videoId).populate("owner","username avatar")

    if(!videoById){
        throw new ApiError(500,"something went wrong while fetching video by Id")
    }

    if(videoById.length===0){
        throw new ApiError(404,"No video found with given ID")
    }

    return res.status(200).json(new ApiResponse(200,videoById,"fetched video by ID"))

    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title,description} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"invalid video id")
    }

    if(!title?.trim() || !description?.trim()){
        throw new ApiError(403,"invalid title/description")
    }

    const thumbnailLocalPath = req.file?.path;

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const loggedInUser = req.user?._id

    const videoOwner = await Video.findById(videoId).select("owner -_id")

    if(videoOwner.owner.toString()!==loggedInUser.toString()){
        throw new ApiError(403,"You are not the actual owner of this video")
    }

    const updateTheVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail:thumbnail?.url || ""   
            }
        },
        {
            new:true
        }
    )

    if(!updateTheVideo){
        throw new ApiError(500,"something went wrong while updating the video")
    }

    return res.status(200).json(new ApiResponse(200,updateTheVideo,"video details updated successfully"))


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"invalid video id")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(401,"User didn't logged in properly ")
    }

    const videoById = await Video.findByIdAndDelete(videoId)

    if(!videoById){
        throw new ApiError(500,"something went wrong while deleting video by Id")
    }

    if(videoById.length===0){
        throw new ApiError(404,"No video found with given ID")
    }

    return res.status(200).json(new ApiResponse(200,videoById,"deleted video by ID"))
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(401,"invalid user")
    }

    const checkVideoOwner = await Video.findById(videoId).select("owner")

    if(!checkVideoOwner){
        throw new ApiError(404,"video not found")
    }

    if(!checkVideoOwner.owner.equals(loggedInUser)){
        throw new ApiError(401,"you are Not the owner of this video >..<")
    }

    const toggleStatus = await Video.findById(videoId)
    
    toggleStatus.isPublished = !toggleStatus.isPublished
    
    await toggleStatus.save()

    if(!toggleStatus){
        throw new ApiError(500,"something went wrong while changing the status of video")
    }
    
        return res.status(200).json(new ApiResponse(200,toggleStatus,"video publish status changed successfully"))
})

const getMoreVideos = asyncHandler(async (req, res) => {

    const { videoId } = req.params


    const {page=1,limit=10} = req.query

    const skip =(parseInt(page)-1)*(parseInt(limit))

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    const loggedInUser = req.user?._id;

    if(!loggedInUser){
       return new ApiError(400,"user didn't logged in")
    }

    const result = await Video.find({ _id:{$ne:videoId}, isPublished: true })
    .populate("owner", "username avatar fullName")
    .sort({ createdAt: -1 })
    .skip(skip).limit(parseInt(limit))

    const videosCount = await Video.countDocuments()
    

    if(!result){
       return new ApiError(500,"something went wrong while fetching all videos")
    }

    return res.status(200).json(new ApiResponse(200,{
        result,
        videosCount:videosCount,
        page:parseInt(page),
        limit:parseInt(limit)
    },"all available videos fetched"))

})

const getVideosfromSubscribedChannel = asyncHandler(async (req, res) => {

    const { channelId } = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"invalid video id")
    }

    const loggedInUser = req.user?._id;

    if(!loggedInUser){
       return new ApiError(400,"user didn't logged in")
    }

    //const result = await Video.find().limit(25).select("-__v")

    const result = await Video.find({ owner:channelId, isPublished: true })
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 })
    .limit(20);
    

    if(!result){
       return new ApiError(500,"something went wrong while fetching all videos from subscribed channel")
    }

    return res.status(200).json(new ApiResponse(200,result,"all available videos from subscribed channel fetched"))

    //TODO: get video by id
})

const getVideosFromPlaylist = asyncHandler(async (req, res) => {

    const { videos } = req.body

    // if(!isValidObjectId(channelId)){
    //     throw new ApiError(400,"invalid video id")
    // }

    const loggedInUser = req.user?._id;

    if(!loggedInUser){
       return new ApiError(400,"user didn't logged in")
    }

    //const result = await Video.find().limit(25).select("-__v")

    const result = await Video.find({_id:{$in:videos}}).select("_id thumbnail owner title duration views createdAt isPublished createdAt").populate("owner", "fullName username avatar")
    

    if(!result){
       return new ApiError(500,"something went wrong while fetching all videos from subscribed channel")
    }

    return res.status(200).json(new ApiResponse(200,result,"all available videos from playlist fetched"))

    //TODO: get video by id
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getVideosFromAllusers,
    getMoreVideos,
    getVideosfromSubscribedChannel,
    getVideosFromPlaylist,
    getVideosFromOwnChannel
}
