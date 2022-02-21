// getting-started.js
import mongoose from "mongoose";

export const connectDb = async () => {
  const connURL = process.env.MONGO_URL || "mongodb://localhost:27017/test";
  const env = process.env.NODE_ENV || "development";
  console.log(`Connecting to ${connURL}`);
  if (env === "development") {
    const m = await mongoose.connect(connURL);
    console.log(`Connected to MongoDB version ${m.version} at ${connURL}`);
  } else {
    const m = await mongoose.connect(connURL, {
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PASS,
      authSource: "admin",
      dbName: "the-watcher-bot",
    });
    console.log(`Connected to MongoDB version ${m.version} at ${connURL}`);
  }

  
};
