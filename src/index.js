import 'dotenv/config'
import connectDB from "./db/index.js";
import app  from './app.js';


// dotenv.config({
//     path:'../env'
// });

// connectDB().then(()=>{
//     app.on("error",(error)=>{
//         console.log("Error - ",error);
//         process.exit(1)
//     })
//     app.listen(process.env.PORT||8000,()=>{
//         console.log(`Express is running at PORT : ${process.env.PORT}`);
//     })
// }).catch((err)=>{
//     console.log("Database connection failed :(",err);
//     process.exit(1)
// })


export default async function handler(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    return app(req, res);
  } catch (error) {
    console.error("DB connection failed:", error);
    res.status(500).json({ message: "DB connection error" });
  }
}