import {
  Guild,
  NSFWLevel,
  GuildTextBasedChannel,
  CommandInteraction,
  TextChannel,
  Client,
} from "discord.js";
import mongoose, { model, Document, Model } from "mongoose";
import { getTextChannel } from "../utils/bot_utils";

import { PortalViews } from "../views/portalViews";
import { portalRequestCollector } from "../collectors/portalRequest";
import { TWGuildManager } from "../managers/TWGuildManager";

export const SERVER_MODEL = "Server";

export interface IServerSetup {
  channelId: string;
  adminRoleIds: string[];
  settings?: IServerConfig;
}

export interface IServerConfig {
  allowBannedMembers: boolean;
  allowMedia: boolean;
  allowNSFW: boolean;
  allowExternalInvites: boolean;
}

const DEFAULT_SETTINGS = {
  allowBannedMembers: false,
  allowMedia: true,
  allowNSFW: true,
  allowExternalInvites: true,
} as IServerConfig;
interface IServer {
  serverId: string;
  dashboardChannelId?: string;
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
  bannedServers?: string[];
  whiteList?: string[];
  bannedUsers?: string[];
  createdAt: Date;
  botJoinedAt: Date;
  botLeftAt?: Date;
  nsfwLevel: NSFWLevel;
  isSetup: boolean;
  settings: IServerConfig;
}
export interface IServerDocument extends IServer, Document {
  invite: (
    interaction: CommandInteraction,
    channel: GuildTextBasedChannel
  ) => Promise<void>;
  setup: (serverSetup: IServerSetup) => Promise<IServerDocument>;
  dashboardChannel: (client: Client) => Promise<TextChannel | null>;
}

export interface IServerModel extends Model<IServerDocument> {
  allRequestIds: () => Promise<
    {
      requestMessageId: string;
      originChannelId: string;
      requestMessageChannelId: string;
    }[]
  >;
  new: (guild: Guild) => Promise<IServerDocument>;
  get: (serverId: string) => Promise<IServerDocument>;
  DEFAULT_SETTINGS: IServerConfig;
}

const serverSchema = new mongoose.Schema<IServerDocument>({
  serverId: { type: String, required: true, unique: true },
  dashboardChannelId: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  memberCount: { type: Number, required: false, unique: false },
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
  bannedServers: [{ type: String, required: false, unique: false }],
  bannedUsers: [{ type: String, required: false, unique: false }],
  whiteList: [{ type: String, required: false, unique: false }],
  createdAt: { type: Date, required: false, unique: false },
  botJoinedAt: { type: Date, required: false, unique: false },
  botLeftAt: { type: Date, required: false, unique: false },
  nsfwLevel: { type: String, required: false, unique: false },
  isSetup: { type: Boolean, required: true, unique: false, default: false },
  settings: {
    allowBannedMembers: { type: Boolean, required: false, unique: false },
    allowMedia: { type: Boolean, required: false, unique: false },
    allowNSFW: { type: Boolean, required: false, unique: false },
    allowExternalInvites: { type: Boolean, required: false, unique: false },
  },
});

serverSchema.methods.invite = async function (
  interaction: CommandInteraction,
  channelToOpenAPortal: TextChannel
): Promise<void> {
  console.log("inviting");
  const dashboardChannelId = this.dashboardChannelId || "";
  const trafficChannel = getTextChannel(interaction.client, dashboardChannelId);

  if (!trafficChannel) {
    throw new Error("No dashboard channel found");
    return;
  }
  const messageContent = await PortalViews.request(
    interaction,
    channelToOpenAPortal,
    this.serverId
  );

  const requestMessage = await trafficChannel.send(messageContent);
  this.requestMessages
    ? this.requestMessages.push({
        requestMessageId: requestMessage.id,
        originChannelId: channelToOpenAPortal.id,
        requestMessageChannelId: trafficChannel.id,
      })
    : (this.requestMessages = [
        {
          requestMessageId: requestMessage.id,
          originChannelId: channelToOpenAPortal.id,
          requestMessageChannelId: trafficChannel.id,
        },
      ]);
  await this.save();
  portalRequestCollector(requestMessage, channelToOpenAPortal);
};

serverSchema.statics.allRequestIds = async function () {
  const servers = await this.find({
    dashboardChannelId: { $exists: true, $nin: ["", undefined] },
    requestMessages: { $exists: true, $ne: [] },
  });

  const requests = servers.map(
    (server: IServerDocument) => server.requestMessages
  );
  return requests.flat();
};

// serverSchema.statics.getTrafficChannel = async function (
//   serverId: string
// ): Promise<GuildTextBasedChannel | null> {
//   const server = await this.findOne({ serverId });
//   if (!server) {
//     return null;
//   }
//   const trafficChannelId = server.trafficChannelId;
//   const trafficChannel = getTextChannel(server.serverId, trafficChannelId);
//   return trafficChannel;
// };

serverSchema.methods.dashboardChannel = async function (
  client: Client
): Promise<TextChannel | null> {
  try {
    const dashboardChannelId = this.dashboardChannelId;
    const dashboardChannel = TWGuildManager.getTextChannel(
      client,
      dashboardChannelId
    );
    return dashboardChannel;
  } catch (e) {
    return null;
  }
};

serverSchema.methods.setup = async function (
  serverSetup: IServerSetup
): Promise<IServerDocument> {
  const thisCtx = this as IServerDocument;
  await thisCtx.updateOne({
    dashboardChannelId: serverSetup.channelId,
    adminRoles: serverSetup.adminRoleIds,
    isSetup: true,
    settings: serverSetup.settings || DEFAULT_SETTINGS,
  });
  await thisCtx.save();
  return this as IServerDocument;
};

serverSchema.statics.new = async function (
  guild: Guild
): Promise<IServerDocument> {
  //check if server exists by serverId
  const serverId = guild.id;
  const memberCount = guild.memberCount;
  const createdAt = guild.createdAt;
  const botJoinedAt = guild.joinedAt;
  const nsfwLevel = guild.nsfwLevel;
  const server = await Server.findOne({ serverId });
  if (server) return server;
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

serverSchema.statics.get = async function (serverId: string) {
  const server = await this.findOne({ serverId });
  if (!server) {
    return null;
  }
  return server as IServerDocument;
};

export const Server = model<IServerDocument, IServerModel>(
  SERVER_MODEL,
  serverSchema
);

// export const getTrafficChannel = async (
//   server: Guild
// ): Promise<GuildTextBasedChannel> => {
//   const serverModel = await Server.findOne({ serverId: server.id });
//   if (!serverModel || !serverModel.trafficChannelId) {
//     throw new Error(
//       "I can't find a traffic channel in the server! Please let them know to `/setup` the bot correctly."
//     );
//   }

//   const trafficChannel = getTextChannel(
//     server.client,
//     serverModel.trafficChannelId
//   );
//   if (!trafficChannel) {
//     throw new Error(
//       "I can't find a traffic channel in the server! Please let them know to `/setup` the bot correctly."
//     );
//   }
//   return trafficChannel;
// };

// export const setupServer = async (
//   serverId: string,
//   trafficChannelId: string,
//   everythingChannelId?: string,
//   adminRoles?: string[],
//   allowServerBanned?: boolean
// ) => {
//   //find and uopdate server
//   const server = await Server.findOneAndUpdate(
//     { serverId },
//     {
//       serverId,
//       trafficChannelId,
//       everythingChannelId,
//       adminRoles,
//       allowServerBanned,
//       isSetup: true,
//     },
//     { upsert: true, new: true }
//   );
//   return server;
// };

// export const newServer = async (guild: Guild) => {
//   const serverId = guild.id;
//   const memberCount = guild.memberCount;
//   const createdAt = guild.createdAt;
//   const botJoinedAt = guild.joinedAt;
//   const nsfwLevel = guild.nsfwLevel;

//   //check if server exists by serverId
//   const server = await Server.findOne({ serverId });
//   if (server) {
//     return;
//   }
//   const newServer = new Server({
//     serverId,
//     memberCount,
//     nsfwLevel,
//     createdAt,
//     botJoinedAt,
//   });
//   await newServer.save();
//   return newServer;
// };

// export const getAdminRoles = async (serverId: string) => {
//   const server = await Server.findOne({ serverId });
//   if (!server) {
//     return;
//   }
//   return server.adminRoles;
// };

// export const getServerById = async (
//   serverId: string
// ): Promise<IServerDocument> => {
//   try {
//     const server = await Server.findOne({ serverId });

//     return server as IServerDocument;
//   } catch (error) {
//     console.error(error);
//     throw new Error("Server not found");
//   }
// };
