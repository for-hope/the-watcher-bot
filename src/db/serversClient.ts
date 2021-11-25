import {
  Guild,
  NSFWLevel,
  GuildTextBasedChannel,
  CommandInteraction,
} from "discord.js";
import mongoose, { model, Document } from "mongoose";
import { getTextChannel } from "../utils/bot_utils";
import { portalRequestEmbed } from "../views/embeds/portalRequestEmbed";
import { portalRequestAction } from "../views/actions/portalRequestActions";
import { PortalViews } from "../views/portalViews";

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
  invite: (
    interaction: CommandInteraction,

    channel: GuildTextBasedChannel
  ) => Promise<void>;
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

const Server = model<IServerDocument>(SERVER_MODEL, serverSchema);

serverSchema.methods.invite = async function (
  interaction: CommandInteraction,
  channel: GuildTextBasedChannel
) {
  const trafficChannelId = this.trafficChannelId;
  if (!trafficChannelId) {
    throw new Error(
      "The other servers needs to set a traffic channel first. Let them know to use `!setup` to do that."
    );
  }
  const trafficChannel = getTextChannel(interaction.client, trafficChannelId);
  if (!trafficChannel) {
    throw new Error(
      "The other servers needs to set a traffic channel first. Let them know to use `!setup` to do that."
    );
  }
  const messageContent = await PortalViews.request(
    interaction,
    channel,
    this.serverId
  );

  await trafficChannel.send(messageContent);
};

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

export const getTrafficChannel = async (
  server: Guild
): Promise<GuildTextBasedChannel> => {
  const serverModel = await Server.findOne({ serverId: server.id });
  if (!serverModel) {
    throw new Error(
      "I can't find a traffic channel in the server! Please let them know to `/setup` the bot correctly."
    );
  }
  const trafficChannel = serverModel.trafficChannel(server);
  if (!trafficChannel) {
    throw new Error(
      "I can't find a traffic channel in the server! Please let them know to `/setup` the bot correctly."
    );
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
    throw new Error("Server not found");
  }
};
