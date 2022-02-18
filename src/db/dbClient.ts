// getting-started.js
import mongoose from "mongoose";

export const connectDb = async () => {
  const connURL = process.env.MONGO_URL || "mongodb://localhost:27017/test";
  const m = await mongoose.connect(connURL);
  console.log(`Connected to MongoDB version ${m.version} at ${connURL}`);
};
