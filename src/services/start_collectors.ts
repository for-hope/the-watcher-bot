import { Client } from "discord.js";
import { getMessage, getTextChannel } from "../utils/bot_utils";
import { Server } from "../db/serversClient";
import { portalRequestCollector } from "../collectors/portalRequest";

export const startCollectors = (client: Client) => {
  Server.allRequestIds().then((listOfRequests) => {
    listOfRequests.forEach(async (request) => {
      const channel = getTextChannel(client, request.originChannelId);

      const message = await getMessage(
        client,
        request.requestMessageId,
        request.requestMessageChannelId
      );

      if (!channel || !message) return;

      portalRequestCollector(message, channel);
    });
  });
};
