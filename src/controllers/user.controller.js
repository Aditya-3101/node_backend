import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import { Video } from "../models/video.model.js";
import {ApiResponse} from '../utils/ApiResponse.js'
import {uploadOnCloudinary} from '../utils/cloudnary.js'
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";

const generateAcessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)

        const accessToken =  user.generateAcessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave:false })

        return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"something went wrong while generating refresh and access toekn")
    }
}


const registerUser = asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })
    //get user details from user/frontend
    //validation - check if any field is empty or not
    //check if user already exists by checking email,username
    //check for images, check for avatar
    //upload them to cloudinary
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response 
    const {username,fullName,email,password} = req.body

    if([fullName,email,username,password].some(field=>field?.trim()==="")){
        throw new ApiError(400, "Fields are not filled")
    }

    const existedUser = await User.findOne({
        $or:[
            {username},{email}
        ]
    })

    if(existedUser){
        throw new ApiError(409,"User with email/username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;

    if(req.files&&Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }
    //const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"pfp is not uploaded :(")
    }



    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if(!avatar){
        throw new ApiError(400,"pfp is not uploaded :(")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!userCreated){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,userCreated,"user registered :)")
    )

})

const loginUser = asyncHandler(async(req,res)=>{
    // req body -> data
    // username or email
    // find the user
    // password check if user is found
    // access and refresh token
    // send cookie

    const {email,username,password} = req.body

    if(!(username || email)){
        throw new ApiError(400, "username or password is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new Error(404,"User doesn't exist")
    }

    const isValidPassword = await user.isPasswordCorrect(password)

    if(!isValidPassword){
        throw new Error(401,"incorrect password :(")
    }

    const {refreshToken,accessToken} = await generateAcessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
    
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        if(!incomingRefreshToken){
            throw new ApiError(401, "unauthorized requrest")
        }
        
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select(
            "-password"
          )
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,refreshToken} = await generateAcessAndRefreshTokens(user._id)

        const safeUser = {
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            coverImage: user.coverImage,
            watchHistory: user.watchHistory,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            __v: user.__v
          };
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {safeUser,accessToken,refreshToken:refreshToken},
                "Access token refreshed"
            )
        )
    
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
    }

})

const changeCurrentUserPassword = asyncHandler(async(req,res)=>{
    try{
        const {oldPassword, newPassword} = req.body

        const user = await User.findById(req.user?._id)

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if(!isPasswordCorrect){
            throw new ApiError(400,"Invalid password :(")
        }

        user.password = newPassword

        await user.save({validateBeforeSave:false})

        return res.status(200).json(new ApiResponse(200,{},"password changed successflly :)"))

    }catch(error){
        throw new ApiError(400,"Invalid password")
    }
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    const response = {
        _id:req.user._id,
        username:req.user.username,
        email:req.user.email,
        fullName:req.user.fullName,
        avatar:req.user.avatar,
        coverImage:req.user.coverImage,
        createdAt:req.user.createdAt
    }
    return res.status(200)
    .json( new ApiResponse(200,response,"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body

    if(!fullName||!email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
            fullName,
            email
        }
    }).select("-password -refreshToken -watchHistory")

    return res.status(200).json(new ApiResponse(200,user,"Account Details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while updating avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },{new:true}
    ).select("-password -refreshToken -watchHistory")



    return res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while updating cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },{new:true}
    ).select("-password -refreshToken -watchHistory")

    if(!user){
        throw new ApiError(500,"something went wrong while updating cover image")
    }

    return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate(
        [
            {
                $match:{
                    username:username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscriberdTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    channelSubscribedToCount:{
                        $size:"$subscriberdTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                    }
                }
            },
            {
                $project:{
                    fullName:1,
                    username:1,
                    subscribersCount:1,
                    channelSubscribedToCount:1,
                    isSubscribed:1,
                    avatar:1,
                    coverImage:1,
                    email:1
                }
            }

        ]
        )
    
        if(!channel?.length){
            throw new ApiError("404","channel doesn't exist")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,channel[0],"User channel fetched successfully")
        )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $unwind:"$watchHistory"
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory.video",
                foreignField:"_id",
                as:"video"
            }
        },
        {
            $addFields:{
                video:{$first:"$video"}
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"video.owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            },
        },
        {
            $addFields:{
                "video.owner":{$first:"$owner"}
            }
        },
        {
            $project:{
                _id:1,
                video:1,
                watchedOn:"$watchHistory.watchedOn"
            }
        }
    ])

    if(!user){
        throw new ApiError(500,"something went wrong while fetching history")
    }

    return  res
    .status(200)
    .json(new ApiResponse(200,user,"Watch history fetched successfully"))
})

const pushVideosIntoHistory = asyncHandler(async(req,res)=>{
    const {videoId} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video ID")
    }

    const loggedInUser = req.user

    if(!loggedInUser){
        throw new ApiError(400,"user didn't logged in")
    }

    await User.findByIdAndUpdate(loggedInUser._id,{
        $pull:{
            watchHistory:{
                "video":videoId
            }
        }
    })

    await Video.findByIdAndUpdate(videoId,{
        $inc:{
            views:1
        }
    })

    const result = await User.findByIdAndUpdate(loggedInUser._id,{
        $push:{
            watchHistory:{
                "video":videoId,
                "watchedOn":new Date().toISOString()
            }
        }
    },{
        new:true
    }).select("_id username fullName createdAt watchHistory")

    if(!result){
        throw new ApiError(500,"something went wrong while pushing videos into watchhistory")
    }

    return res.status(200).json(new ApiResponse(200,result,"videos pushed into watch history sucessfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    pushVideosIntoHistory
}