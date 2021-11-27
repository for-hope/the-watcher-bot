import { Client } from "discord.js";
import { getMessage, getTextChannel } from "../utils/bot_utils";
import { Server } from "../db/serversClient";
import { portalRequestCollector } from "../collectors/portalRequest";

export const startCollectors = async (client: Client) => {
  const listOfRequests = await Server.allRequestIds();
  listOfRequests.forEach(async (request) => {
    const channel = getTextChannel(client, request.originChannelId);
    const message = await getMessage(
      client,
      request.id,
      request.originChannelId
    );
    if (!channel || !message) return;
    portalRequestCollector(message, channel);
  });
};
