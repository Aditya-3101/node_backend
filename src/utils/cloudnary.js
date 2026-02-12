import {v2 as cloudinary} from "cloudinary"
import { log } from "console"
import { response } from "express"
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async(localFilePath) =>{
    try {
        if(!localFilePath) return null
        //upload the file on server
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"});
        console.log("File is uploded on server ",response.url);
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
        //remove the locally saved file as the upload operation is failed
    }
}

export {uploadOnCloudinary}