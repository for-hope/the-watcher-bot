import { Guild, NSFWLevel, GuildTextBasedChannel } from "discord.js";
import mongoose, { model, Document } from "mongoose";
import { getTextChannel } from "../utils/bot_utils";

export const SERVER_MODEL = "Server";

interface IServer {
  serverId: string;
  trafficChannelId?: string;
  everythingChannelId?: string;
  memberCount: number;
  adminRoles?: string[];
  banList?: string[];
  whiteList?: string[];
  allowServerBanned?: boolean;
  createdAt: Date;
  botJoinedAt: Date;
  botLeftAt?: Date;
  nsfwLevel: NSFWLevel;
  isSetup: boolean;
}

interface IServerDocument extends IServer, Document {
  trafficChannel: (server: any) => GuildTextBasedChannel | undefined;
}

const serverSchema = new mongoose.Schema<IServerDocument>({
  serverId: { type: String, required: true, unique: true },
  trafficChannelId: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  memberCount: { type: Number, required: true, unique: false },
  adminRoles: [{ type: String, required: false, unique: false }],
  banList: [{ type: String, required: false, unique: false }],
  whiteList: [{ type: String, required: false, unique: false }],
  allowServerBanned: {
    type: Boolean,
    required: false,
    unique: false,
    default: false,
  },
  createdAt: { type: Date, required: true, unique: false },
  botJoinedAt: { type: Date, required: true, unique: false },
  botLeftAt: { type: Date, required: false, unique: false },
  nsfwLevel: { type: String, required: true, unique: false },
  isSetup: { type: Boolean, required: true, unique: false, default: false },
});

serverSchema.methods.trafficChannel = function (
  this: IServerDocument,
  server: Guild
): GuildTextBasedChannel | undefined {
  if (!this.trafficChannelId) {
    return;
  }
  const trafficChannel = getTextChannel(server.client, this.trafficChannelId);
  return trafficChannel as GuildTextBasedChannel;
};

const Server = model<IServerDocument>(SERVER_MODEL, serverSchema);

export const getTrafficChannel = async (
  server: Guild
): Promise<GuildTextBasedChannel> => {
  const serverModel = await Server.findOne({ serverId: server.id });
  if (!serverModel) {
    throw new Error("Traffic channel not found");
  }
  const trafficChannel = serverModel.trafficChannel(server);
  if (!trafficChannel) {
    throw new Error("Traffic channel not found for server " + server);
  }
  return trafficChannel;
};

export const setupServer = async (
  serverId: string,
  trafficChannelId: string,
  everythingChannelId?: string,
  adminRoles?: string[],
  allowServerBanned?: boolean
) => {
  //find and uopdate server
  const server = await Server.findOneAndUpdate(
    { serverId },
    {
      serverId,
      trafficChannelId,
      everythingChannelId,
      adminRoles,
      allowServerBanned,
      isSetup: true,
    },
    { upsert: true, new: true }
  );
  return server;
};

export const newServer = async (guild: Guild) => {
  const serverId = guild.id;
  const memberCount = guild.memberCount;
  const createdAt = guild.createdAt;
  const botJoinedAt = guild.joinedAt;
  const nsfwLevel = guild.nsfwLevel;

  //check if server exists by serverId
  const server = await Server.findOne({ serverId });
  if (server) {
    return;
  }
  const newServer = new Server({
    serverId,
    memberCount,
    nsfwLevel,
    createdAt,
    botJoinedAt,
  });
  await newServer.save();
  return newServer;
};

export const getAdminRoles = async (serverId: string) => {
  const server = await Server.findOne({ serverId });
  if (!server) {
    return;
  }
  return server.adminRoles;
};

export const getServerById = async (serverId: string) => {
  try {
    const server = await Server.findOne({ serverId });
    return server;
  } catch (error) {
    console.error(error);
    throw new Error("Server not found");
  }
};
