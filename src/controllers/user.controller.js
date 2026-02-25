import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {uploadOnCloudinary} from '../utils/cloudnary.js'


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

    console.log("BODY:", req.body)
console.log("FILES:", req.files)
console.log("FILES KEYS:", Object.keys(req.files || {}))

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

export {registerUser}