import mongoose, { model } from "mongoose";
import { IDimension } from "./dimensionClient";

export const PORTAL_MODEL = "Portal";

interface IPortal extends IDimension {
  creatorId: string;
  originServerId: string;
  originChannelId: string;
  openInvitation: boolean;
}

const portalSchema = new mongoose.Schema<IPortal>({
  name: { type: String, required: true, unique: false },
  servers: [
    {
      server_id: { type: String, required: true, unique: false },
      channel_id: { type: String, required: true, unique: false },
    },
  ],
  creatorId: { type: String, required: true, unique: false },
  originServerId: { type: String, required: true, unique: false },
  originChannelId: { type: String, required: true, unique: true },
  openInvitation: { type: Boolean, default: true },
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

export const addServerOnPortal = async (
  originChannelId: string,
  channelId: string,
  serverId: string
): Promise<Array<string>> => {
  try {
    let portal = await Portal.findOne({ originChannelId: originChannelId });
    if (!portal) {
      console.log("Portal doesn't exist");
      return [];
    }

    portal.servers.push({
      server_id: serverId,
      channel_id: channelId,
    });

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
  authorId: string,
  serverId: string,
  channelId: string
): Promise<boolean> => {
  try {
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
