import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber :{
            type:Schema.Types.ObjectId, //yt channel subscriber
            ref:"User"
        },
        channel:{
            type:Schema.Types.ObjectId, //yt channel 
            ref:"User"
        }
    },
    {
        timestamps:true
    }
)

export const Subscription = mongoose.model("Subscription",subscriptionSchema)