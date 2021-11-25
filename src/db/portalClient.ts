import { Client, CommandInteraction, TextChannel } from "discord.js";
import mongoose, { model, Document } from "mongoose";
import { CONNECTION_REQUEST_STATUS } from "../utils/bot_embeds";

export const PORTAL_MODEL = "Portal";

export interface IPortalServer {
  server_id: string;
  channel_id: string;
  server_status: string;
  requestMessage: {
    id: string;
    channel_id: string;
  };
}
export interface IPortal {
  name: { type: String; required: true };
  creatorId: string;
  originServerId: string;
  originChannelId: string;
  openInvitation?: boolean;
  servers: [
    {
      server_id: string;
      channel_id: string;
      server_status: string;
      requestMessage: {
        id: string;
        channel_id: string;
      };
    }
  ];
}
export enum PortalRequest {
  approved = "Approved",
  denied = "Denied",
  pending = "Pending",
  left = "Left",
  banned = "Banned",
  canceled = "Canceled",
  unkown = "Unknown",
}

export interface IPortalDocument extends IPortal, Document {
  updateServerStatus: (serverStatus: PortalRequest) => Promise<IPortalDocument>;
}

const portalSchema = new mongoose.Schema<IPortalDocument>({
  name: { type: String, required: true, unique: false },
  servers: [
    {
      server_id: { type: String, required: true, unique: false },
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
    },
  ],
  creatorId: { type: String, required: true, unique: false },
  originServerId: { type: String, required: true, unique: false },
  originChannelId: { type: String, required: true, unique: true },
  openInvitation: { type: Boolean, default: true }, //other servers can invite other servers to this portal
});

portalSchema.methods.updateServerStatus = async function (
  serverStatus: PortalRequest
) {
  const portal = this;
  portal.servers.forEach((server) => {
    server.server_status = serverStatus;
  });
  return portal.save();
};

const Portal = model<IPortalDocument>(PORTAL_MODEL, portalSchema);

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
    const channels = portal.servers.map((server) => server.channel_id);

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
      console.log("Portal doesn't exist");
      return [];
    }

    //if server id doesn't exist push otherwise update
    const server = portal.servers.find(
      (server) => server.server_id === serverId
    );
    if (!server) {
      console.log("Server doesn't exist");
      portal.servers.push({
        server_id: serverId,
        channel_id: channelId,
        server_status: serverStatus,
        requestMessage: {
          id: requestMessageId || "",
          channel_id: requestMessageChannelId || "",
        },
      });
    } else {
      console.log("Server exists");
      server.server_status = serverStatus;
      if (!server.channel_id) {
        server.channel_id = channelId;
      }
      if (requestMessageId !== null && requestMessageChannelId !== null) {
        console.log("Request message exists");
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
      console.log("Request message exists");
      const channel = client.channels.cache.get(reqMsgChannelId) as TextChannel;
      const msg = await channel.messages.fetch(reqMsgId);
      if (msg) {
        console.log("Message exists");
        //edit message
        const embed = msg.embeds[0];
        embed.fields[0].value = CONNECTION_REQUEST_STATUS(serverStatus);
        await msg.edit({ embeds: [embed] });
      }
    }
    console.log("Saving portal");
    await portal.save();
    console.log("Portal updated!");
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
): Promise<boolean> => {
  try {
    const authorId = interaction.user.id;
    const serverId = interaction.guildId;
    let portal = await Portal.findOne({ "servers.channel_id": channelId });

    if (portal) {
      console.log("Channel Already exists on other portal.");
      return false;
    }

    console.log("No portal found, creating one...");

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
    });

    await portal.save();
    console.log("Portal added.");
    return true;
  } catch (err) {
    console.log(err);
    return false;
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
    return portal.servers.map((server) => server.server_id);
  } catch (err) {
    console.log("Error fetching servers : " + err);
    return [];
  }
};
