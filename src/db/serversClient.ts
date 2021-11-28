import {
  Guild,
  NSFWLevel,
  GuildTextBasedChannel,
  CommandInteraction,
} from "discord.js";
import mongoose, { model, Document, Model } from "mongoose";
import { getTextChannel } from "../utils/bot_utils";

import { PortalViews } from "../views/portalViews";
import { portalRequestCollector } from "../collectors/portalRequest";

export const SERVER_MODEL = "Server";

interface IServer {
  serverId: string;
  trafficChannelId?: string;
  everythingChannelId?: string;
  memberCount: number;
  requestMessages?: [
    {
      requestMessageId: string;
      originChannelId: string;
      requestMessageChannelId: string;
    }
  ];
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
export interface IServerDocument extends IServer, Document {
  invite: (
    interaction: CommandInteraction,

    channel: GuildTextBasedChannel
  ) => Promise<void>;
}

export interface IServerModel extends Model<IServerDocument> {
  allRequestIds: () => Promise<
    {
      requestMessageId: string;
      originChannelId: string;
      requestMessageChannelId: string;
    }[]
  >;
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
  requestMessages: [
    {
      requestMessageId: { type: String, required: false, unique: false },
      requestMessageChannelId: {
        type: String,
        required: false,
        unique: false,
      },
      originChannelId: { type: String, required: false, unique: false },
    },
  ],

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

serverSchema.methods.invite = async function (
  interaction: CommandInteraction,
  channel: GuildTextBasedChannel
): Promise<void> {
  const trafficChannelId = this.trafficChannelId || "";

  const trafficChannel = getTextChannel(interaction.client, trafficChannelId);

  if (!trafficChannel) {
    return;
  }
  const messageContent = await PortalViews.request(
    interaction,
    channel,
    this.serverId
  );

  const requestMessage = await trafficChannel.send(messageContent);
  this.requestMessages
    ? this.requestMessages.push({
        requestMessageId: requestMessage.id,
        originChannelId: channel.id,
        requestMessageChannelId: trafficChannel.id,
      })
    : (this.requestMessages = [
        {
          requestMessageId: requestMessage.id,
          originChannelId: channel.id,
          requestMessageChannelId: trafficChannel.id,
        },
      ]);
  await this.save();
  portalRequestCollector(requestMessage, channel);
};

serverSchema.statics.allRequestIds = async function () {
  const servers = await this.find({
    trafficChannelId: { $exists: true, $nin: ["", undefined] },
    requestMessages: { $exists: true, $ne: [] },
  });

  const requests = servers.map(
    (server: IServerDocument) => server.requestMessages
  );
  return requests.flat();
};

export const Server = model<IServerDocument, IServerModel>(
  SERVER_MODEL,
  serverSchema
);
export const getTrafficChannel = async (
  server: Guild
): Promise<GuildTextBasedChannel> => {
  const serverModel = await Server.findOne({ serverId: server.id });
  if (!serverModel || !serverModel.trafficChannelId) {
    throw new Error(
      "I can't find a traffic channel in the server! Please let them know to `/setup` the bot correctly."
    );
  }

  const trafficChannel = getTextChannel(
    server.client,
    serverModel.trafficChannelId
  );
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

export const getServerById = async (
  serverId: string
): Promise<IServerDocument> => {
  try {
    const server = await Server.findOne({ serverId });

    return server as IServerDocument;
  } catch (error) {
    console.error(error);
    throw new Error("Server not found");
  }
};
