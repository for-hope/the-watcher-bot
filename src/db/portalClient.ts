import { Client, CommandInteraction, TextChannel } from "discord.js";
import mongoose, { model, Document, Model } from "mongoose";
import { CONNECTION_REQUEST_STATUS } from "../utils/bot_embeds";

export const PORTAL_MODEL = "Portal";

export interface IPortalServer {
  id: string;
  channel_id: string;
  server_status: string;
  requestMessage: {
    id: string;
    channel_id: string;
  };
  muted?: {
    mutedOn: number;
    duration: number;
  };
}
export interface IPortal {
  name: string;
  creatorId: string;
  originServerId: string;
  originChannelId: string;
  openInvitation?: boolean;
  servers: [
    {
      id: string;
      channel_id: string;
      server_status: string;
      requestMessage: {
        id: string;
        channel_id: string;
      };
      muted?: {
        mutedOn: number;
        duration: number;
      };
    }
  ];
  //string
  bannedServers: [string];
  bannedUsers: [string];
}
export enum PortalRequest {
  approved = "Approved",
  denied = "Denied",
  pending = "Pending",
  left = "Left",
  banned = "Banned",
  canceled = "Canceled",
  unknown = "Unknown",
}

export interface IPortalDocument extends IPortal, Document {
  updateServerStatus: (
    serverId: string,
    serverStatus: PortalRequest
  ) => Promise<IPortalDocument>;

  addServerRequest: (
    guildId: string,
    requestId: string,
    requestChannelId: string
  ) => Promise<IPortalDocument>;

  approveServerRequest: (
    guildId: string,
    channelId: string
  ) => Promise<IPortalDocument>;

  denyServerRequest: (serverId: string) => Promise<IPortalDocument>;

  validChannelIds: () => Array<string>;

  myServer: (serverId: string) => IPortalServer;

  isMemberBlacklisted: (userId: string) => boolean;
  isServerBlacklisted: (serverId: string) => boolean;
  isServerMuted: (serverId: string) => boolean;
  isServerLeft: (serverId: string) => boolean;
  banServer: (serverId: string) => Promise<IPortalDocument>;
  muteServer: (serverId: string, duration: number) => Promise<IPortalDocument>;
  unmuteServer: (serverId: string) => Promise<IPortalDocument>;
  unbanServer: (serverId: string) => Promise<IPortalDocument>;
  findServer: (serverId: string) => IPortalServer | undefined;
}

export interface IPortalModel extends Model<IPortalDocument> {
  requestMessages: () => Promise<Array<{ id: string; channelId: string }>>;
  getByChannelId: (channelId: string) => Promise<IPortalDocument | null>;
}

const portalSchema = new mongoose.Schema<IPortalDocument>({
  name: { type: String, required: true, unique: false },
  servers: [
    {
      id: { type: String, required: true, unique: false },
      channel_id: { type: String, required: false, unique: false },
      server_status: {
        type: String,
        required: true,
        unique: false,
        enum: PortalRequest,
      },
      requestMessage: {
        id: { type: String, required: false },
        channel_id: { type: String, required: false },
      },
      muted: {
        mutedOn: { type: Number, required: false },
        duration: { type: Number, required: false },
      },
    },
  ],
  creatorId: { type: String, required: true, unique: false },
  originServerId: { type: String, required: true, unique: false },
  originChannelId: { type: String, required: true, unique: true },
  openInvitation: { type: Boolean, default: true }, //other servers can invite other servers to this portal
  bannedServers: [typeof String],
  bannedUsers: [typeof String],
});

portalSchema.methods.myServer = function (serverId: string) {
  return this.servers.find((server: any) => server.server_id === serverId);
};

portalSchema.methods.banServer = async function (targetServerId: string) {
  const portal = this;
  //if serverId is already banned return
  if (portal.bannedServers.includes(targetServerId)) return portal;
  portal.bannedServers.push(targetServerId);
  //remove server from portal.servers
  const serverIndex = portal.servers.findIndex(
    (server: any) => server.server_id === targetServerId
  );
  if (serverIndex > -1) {
    portal.servers.splice(serverIndex, 1);
  }
  await portal.save();

  return portal;
};

portalSchema.methods.muteServer = async function (
  serverId: string,
  duration: number
) {
  const portal = this;
  const server = portal.myServer(serverId);
  if (server) {
    server.muted = {
      mutedOn: Date.now(),
      duration,
    };
    await portal.save();
  }
  return portal;
};

portalSchema.methods.unmuteServer = async function (serverId: string) {
  const portal = this;
  const server = portal.myServer(serverId);
  if (server) {
    server.muted = undefined;
    await portal.save();
  }
  return portal;
};

portalSchema.methods.unbanServer = async function (serverId: string) {
  const portal = this;
  const index = portal.bannedServers.indexOf(serverId);
  //if the server is not banned, return
  if (index === -1) return portal;
  if (index > -1) {
    portal.bannedServers.splice(index, 1);
    await portal.save();
  }
  return portal;
};

portalSchema.methods.updateServerStatus = async function (
  serverId: string,
  serverStatus: PortalRequest
) {
  const portal = this;

  portal.servers.forEach((server: any) => {
    if (server.server_id === serverId) {
      server.server_status = serverStatus;
      return;
    }
  });
  return portal.save();
};

portalSchema.methods.addServerRequest = async function (
  guildId: string,
  requestId: string,
  requestChannelId: string
) {
  const portal = this;

  //remove server if it exists on portal
  portal.servers.forEach((server: any) => {
    if (
      server.server_id === guildId &&
      server.server_status !== PortalRequest.approved
    ) {
      portal.servers.splice(portal.servers.indexOf(server), 1);
    }
  });

  portal.servers.push({
    id: guildId,
    channel_id: "",
    server_status: PortalRequest.pending,
    requestMessage: {
      id: requestId,
      channel_id: requestChannelId,
    },
  });

  return portal.save();
};

portalSchema.methods.denyServerRequest = async function (serverId: string) {
  const portal = this;
  portal.servers.forEach((server: any) => {
    if (
      server.server_id === serverId &&
      server.server_status === PortalRequest.pending
    ) {
      server.server_status = PortalRequest.denied;
      return;
    }
  });
  return portal.save();
};

portalSchema.methods.validChannelIds = function () {
  const portal = this;

  //remove server if it exists on portal

  const approvedChannelIds = portal.servers
    .filter((server: any) => server.server_status === PortalRequest.approved)
    .map((server: any) => server.channel_id);

  return approvedChannelIds.flat();
};

portalSchema.methods.approveServerRequest = async function (
  guildId: string,
  channelId: string
) {
  const portal = this;
  portal.servers.forEach((server: any) => {
    if (
      server.server_id === guildId &&
      server.server_status === PortalRequest.pending
    ) {
      server.server_status = PortalRequest.approved;
      server.channel_id = channelId;
      return;
    }
  });
  return portal.save();
};

portalSchema.methods.isMemberBlacklisted = function (userId: string) {
  const portal = this;
  return portal.bannedUsers?.includes(userId);
};

portalSchema.methods.isServerBlacklisted = function (serverId: string) {
  const portal = this;
  return portal.bannedServers?.includes(serverId);
};

portalSchema.methods.isServerMuted = function (serverId: string) {
  const portal = this;
  const server = portal.servers.find(
    (server: any) => server.server_id === serverId
  );
  if (server) {
    const muted = server.muted;
    if (!muted) return false;
    const isMuted = muted.mutedOn + muted.duration > Date.now();
    return isMuted;
  }
  return false;
};

portalSchema.methods.isServerLeft = function (serverId: string) {
  const portal = this;
  const server = portal.servers.find(
    (server: any) => server.server_id === serverId
  );
  if (server) {
    return server.server_status === PortalRequest.left;
  }
  return false;
};

portalSchema.methods.findServer = function (
  serverId: string
): IPortalServer | undefined {
  const portal = this as IPortalDocument;
  return portal.servers.find((server) => server.id === serverId);
};

//TODO handle too many requests / limits
portalSchema.statics.requestMessages = async function () {
  const requestMessages: Array<{
    id: string;
    channelId: string;
  }> = await this.find({
    "servers.server_status": PortalRequest.pending,
  })
    .map((portal: IPortalDocument) => portal.servers)
    .map((server: any) => server.requestMessage);

  return requestMessages;
};

portalSchema.statics.getByChannelId = async function (
  channelId: string
): Promise<IPortalDocument | null> {
  const portal = await Portal.findOne({
    "servers.channel_id": channelId,
  });
  return portal;
};

export const Portal = model<IPortalDocument, IPortalModel>(
  PORTAL_MODEL,
  portalSchema
);

export const getOriginChannelId = async (
  channelId: string
): Promise<string> => {
  const portal = await Portal.findOne({
    "servers.channel_id": channelId,
  });

  if (!portal) {
    return ``;
  }

  return portal.originChannelId;
};

export const getChannelIdsOnPortal = async (
  originChannelId: string
): Promise<Array<string>> => {
  //get all server channels with portal name
  try {
    const portal = await Portal.findOne({ originChannelId: originChannelId });
    if (!portal) {
      return [];
    }

    const channels = portal.servers
      .filter((server) => server.server_status === PortalRequest.approved)
      .map((server) => server.channel_id);

    return channels;
  } catch (err) {
    console.log("Error fetching channels : " + err);
    return [];
  }
};

//TODO getserver method

export const addOrUpdateServerOnPortal = async (
  originChannelId: string,
  channelId: string,
  serverId: string,
  serverStatus: PortalRequest,
  requestMessageId: string | null,
  requestMessageChannelId: string | null,
  client: Client
): Promise<Array<string>> => {
  try {
    let portal = await Portal.findOne({ originChannelId: originChannelId });
    if (!portal) {
      return [];
    }

    //if server id doesn't exist push otherwise update
    const server = portal.servers.find((server) => server.id === serverId);
    if (!server) {
      portal.servers.push({
        id: serverId,
        channel_id: channelId,
        server_status: serverStatus,
        requestMessage: {
          id: requestMessageId || "",
          channel_id: requestMessageChannelId || "",
        },
      });
    } else {
      server.server_status = serverStatus;
      if (!server.channel_id) {
        server.channel_id = channelId;
      }
      if (requestMessageId !== null && requestMessageChannelId !== null) {
        server.requestMessage = {
          id: requestMessageId,
          channel_id: requestMessageChannelId,
        };
      }
    }
    const reqMsgChannelId: string =
      requestMessageChannelId || server?.requestMessage.channel_id || "";
    const reqMsgId: string =
      requestMessageId || server?.requestMessage.id || "";
    if (client) {
      const channel = client.channels.cache.get(reqMsgChannelId) as TextChannel;
      const msg = await channel.messages.fetch(reqMsgId);
      if (msg) {
        //edit message
        const embed = msg.embeds[0];
        embed.fields[0].value = CONNECTION_REQUEST_STATUS(serverStatus);
        await msg.edit({ embeds: [embed] });
      }
    }

    await portal.save();

    return portal.servers.map((server) => server.channel_id);
  } catch (err: any) {
    console.log("Can't update portal Err: " + err.toString());
    return [];
  }
};

export const createServerOnPortal = async (
  portalName: string,
  interaction: CommandInteraction,
  channelId: string
): Promise<IPortalDocument | null> => {
  try {
    const authorId = interaction.user.id;
    const serverId = interaction.guildId;
    let portal = await Portal.findOne({ "servers.channel_id": channelId });

    if (portal) {
      return portal;
    }

    portal = new Portal({
      name: portalName,
      creatorId: authorId,
      originServerId: serverId,
      originChannelId: channelId,
      servers: [
        {
          server_id: serverId,
          channel_id: channelId,
          server_status: PortalRequest.approved,
        },
      ],
      bannedUsers: [],
      bannedServers: [],
    });

    await portal.save();

    return portal;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const portalsByServerId = async (
  serverId: string
): Promise<Array<IPortalDocument> | null> => {
  try {
    const portals = await Portal.find({
      "servers.server_id": serverId,
    });
    return portals;
  } catch (err) {
    console.log("Error fetching portals : " + err);
    return null;
  }
};

export const portalByServersChannelId = async (
  channelId: string
): Promise<IPortalDocument | null> => {
  try {
    const portal = await Portal.findOne({
      "servers.channel_id": channelId,
    });
    return portal;
  } catch (err) {
    console.log("Error fetching portal : " + err);
    return null;
  }
};

export const getServerIdsOnPortal = async (
  channelId: string
): Promise<Array<string>> => {
  try {
    //find portal where channel id is the servers.channelid
    const portal = await Portal.findOne({
      "servers.channel_id": channelId,
    });
    if (!portal) {
      return [];
    }
    return portal.servers.map((server) => server.id);
  } catch (err) {
    console.log("Error fetching servers : " + err);
    return [];
  }
};
