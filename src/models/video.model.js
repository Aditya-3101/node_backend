import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videoFile:{
        type:String, //cloudinary url
        required:true
    },
    thumbnail:{
        type:String, //cloudinary url
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number, //cloudinary url
        required:true
    },
    views:{
        type:Number,
        required:true,
        default:0
    },
    isPublished:{
        type:Boolean,
        required:true,
        default:true
    },
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)

videoSchema.index({ title:"text", description:"text" })
videoSchema.index({ owner:1 })

export const Video = mongoose.model("Video",videoSchema)