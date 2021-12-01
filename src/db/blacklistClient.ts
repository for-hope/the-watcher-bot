import mongoose, { model, Document, Model, Schema } from "mongoose";
export const BLACKLIST_MODEL = "Blacklist";

export interface IBlacklist {
  uid: string;
  type: "server" | "user";
  duration: number;
  reason: string;
  createdAt: number;
}

export interface IBlacklistDocument extends Document, IBlacklist {}

export interface IBlacklistModel extends Model<IBlacklistDocument> {
  servers: () => Promise<string[]>;
  users: () => Promise<string[]>;
  removeEntity: (uid: string) => Promise<void>;
  addServer: (uid: string, duration: string, reason: string) => Promise<void>;
  addUser: (uid: string, duration: string, reason: string) => Promise<void>;
}

const blacklistSchema = new Schema<IBlacklistDocument>({
  uid: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  duration: { type: Number, required: true },
  reason: { type: String, required: true },
  createdAt: { type: Number, required: true },
});

blacklistSchema.statics.servers = async function () {
  const blacklist = await Blacklist.find({ type: "server" });
  return blacklist.map((blacklist) => blacklist.uid);
};

blacklistSchema.statics.users = async function () {
  const blacklist = await Blacklist.find({ type: "user" });
  return blacklist.map((blacklist) => blacklist.uid);
};

blacklistSchema.statics.removeEntity = async function (uid: string) {
  await Blacklist.deleteOne({ uid });
};

blacklistSchema.statics.addServer = async function (
  uid: string,
  duration: number,
  reason: string
) {
  const blacklist = new Blacklist({
    uid,
    type: "server",
    duration: duration,
    reason,
    createdAt: Date.now(),
  });
  await blacklist.save();
};

blacklistSchema.statics.addUser = async function (
  uid: string,
  duration: number,
  reason: string
) {
  const blacklist = new Blacklist({
    uid,
    type: "user",
    duration: duration,
    reason,
    createdAt: Date.now(),
  });
  await blacklist.save();
};

export const Blacklist = model<IBlacklistDocument, IBlacklistModel>(
  BLACKLIST_MODEL,
  blacklistSchema
);
