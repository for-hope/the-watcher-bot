// getting-started.js
import mongoose from "mongoose";

export const connectDb = async () => {
  const m = await mongoose.connect("mongodb://localhost:27017/test");
  console.log("Connected to MongoDB");
};
