import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name?.trim()||!description?.trim()){
        throw new ApiError(400,"invalid playlist name/description")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(400,"No user has been logged in")
    }

    const createdPlaylist = await Playlist.create({
        name,
        description,
        owner:loggedInUser
    })

    if(!createdPlaylist){
        throw new ApiError(500,"something went wrong while creating playlist")
    }

    return res.status(201).json(new ApiResponse(201,createdPlaylist,"Playlist is created sucessfully"))



    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId){
        throw new ApiError(400,"invalid user id")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(400,"user didn't logged in")
    }

    const getplaylist = await Playlist.find({owner:userId})

    if(!getplaylist){
        throw new ApiError(500,"something went wrong while fetching playlist")
    }

    return res.status(200).json(new ApiResponse(200,getplaylist,"fetched user playlist"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlist id")
    }

    const playlistById = await Playlist.findById(playlistId)

    if(!playlistById){
        throw new ApiError(500,"something went wrong while fetching playlist by id")
    }
    
    return res.status(200).json(new ApiResponse(200,playlistById,"fetched user playlist by id"))
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
        throw new ApiError(400,"invalid playlist/video id")
    }

    console.log(playlistId + " "+videoId)

    const loggedInUser = req.user?._id

    const playlist = await Playlist.findOne({_id:playlistId})


if (playlist.owner.toString() != (req.user._id).toString()) {
    throw new ApiError(400, "Only owner of this playlist allowed to add a video")
}

const video = await Video.findById(videoId)
if (!video) {
    throw new ApiError(404, "video does not exist ")
}

const matchedVideo = playlist.videos.find((video) => video.equals(videoId));
if (matchedVideo) {
    throw new ApiError(409, "Video already exists in the playlist");
}

try {
    playlist.videos.push(video);
    const updatedPlaylist = await playlist.save();

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
} catch (error) {
    throw new ApiError(500, "Unable to add video to the playlist")
}
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!playlistId||!videoId){
        throw new ApiError(400,"invalud playlist/video id")
    }

    const playlist = await Playlist.findById(playlistId);
    
    if (playlist.owner.toString() != (req.user._id).toString()) {
        throw new ApiError(400, "You are not the owner of this playlist to remove a video")
    }

    const matchedVideo = playlist.videos.find((video) => video.equals(videoId));
    if (!matchedVideo) {
        throw new ApiError(404, "No video matched with this video id");
    }

    try {
        playlist.videos.pull(videoId);
        const updatedPlaylist = await playlist.save();

        return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video deleted from the playlist successfully"))
    } catch (error) {
        throw new ApiError(500, "Unable to delete this video from the playlist")
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(200,"invalid playlist id")
    }

    const loggedInUser = req.user?._id

    if(!loggedInUser){
        throw new ApiError(403,"user didn't logged in")
    }

    const deleteThePlaylist = await Playlist.findOneAndDelete({_id:playlistId,owner:loggedInUser})

    if(!deleteThePlaylist){
        throw new ApiError(500,"something went wrong while deleting the playlist")
    }

    return res.status(200).json(new ApiResponse(200,deletePlaylist,"deleted the playlist"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlist id")
    }

    if(!name.trim()||!description){
        throw new ApiError(400,"invalid playlist name and description")
    }

    const loggedInUser = req.user?._id;

    if(!loggedInUser){
        throw new ApiError(400,"user didn't logged in")
    }

    const updateThePlaylist = await Playlist.findOneAndUpdate(
        {_id:playlistId},
        {$set:{
            name:name,
            description:description
        }},
        {new:true}
        )

    if(!updateThePlaylist){
        throw new ApiError(500,"something went wrong while updating the playlist")
    }

    return res.status(200).json(new ApiResponse(200,updateThePlaylist,"updated the playlist"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}