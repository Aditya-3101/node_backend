// import app from '../src/app.js';

// export default app;

import mongoose from "mongoose";
import connectDB from "../src/db/index.js";
import app from "../src/app.js";

export default async function handler(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    return app(req, res);
  } catch (error) {
    console.error("DB ERROR:", error);
    return res.status(500).json({ message: "DB connection failed" });
  }
}