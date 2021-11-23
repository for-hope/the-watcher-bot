import { Client, CommandInteraction, TextChannel } from "discord.js";
import mongoose, { model } from "mongoose";
import { IDimension } from "./dimensionClient";

export const PORTAL_MODEL = "Portal";

interface IPortal extends Omit<IDimension, "servers"> {
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
  pending = "Pending :arrows_counterclockwise:",
  joined = "Joined",
  left = "Left",
  banned = "Banned",
  unkown = "Unknown",
}

const portalSchema = new mongoose.Schema<IPortal>({
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

const Portal = model<IPortal>(PORTAL_MODEL, portalSchema);

export const channelPortal = async (channelId: string): Promise<string> => {
  const portal = await Portal.findOne({
    "servers.channel_id": channelId,
  });

  if (!portal) {
    return ``;
  }

  return portal.originChannelId;
};

export const portalChannels = async (
  originChannelId: string
): Promise<Array<String>> => {
  //get all server channels with portal name
  try {
    const portal = await Portal.findOne({ originChannelId: originChannelId });

    const channels = portal.servers.map((server) => server.channel_id);

    return channels;
  } catch (err) {
    console.log("Error fetching channels : " + err);
    return [];
  }
};

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
          id: requestMessageId,
          channel_id: requestMessageChannelId,
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
      requestMessageChannelId || server.requestMessage.channel_id;
    const reqMsgId: string = requestMessageId || server.requestMessage.id;
    if (client) {
      console.log("Request message exists");
      const channel = client.channels.cache.get(reqMsgChannelId) as TextChannel;
      const msg = await channel.messages.fetch(reqMsgId);
      if (msg) {
        console.log("Message exists");
        //edit message
        const embed = msg.embeds[0];
        embed.fields[0].value = serverStatus;
        await msg.edit({ embeds: [embed] });
      }
    }
    console.log("Saving portal");
    await portal.save();
    console.log("Portal updated!");
    return portal.servers.map((server) => server.channel_id);
  } catch (err) {
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
    let portal = await Portal.findOne({ originChannelId: channelId });

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
          server_status: PortalRequest.joined,
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
