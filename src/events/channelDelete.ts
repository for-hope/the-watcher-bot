import { TextChannel } from "discord.js";

import { portalByServersChannelId, PortalRequest } from "../db/portalClient";
import { Server } from "../db/serversClient";
import { deletedChannelAuthor, getTextChannel } from "../utils/bot_utils";

module.exports = {
  name: "channelDelete",
  async execute(channel: TextChannel) {
    const portal = await portalByServersChannelId(channel.id);
    if (!portal) return;

    const channelIdsOnPortal = portal.servers.map(
      (server) => server.channel_id
    );

    const author = await deletedChannelAuthor(channel);

    channelIdsOnPortal.forEach(async (channelId) => {
      const portalChannel = getTextChannel(channel.client, channelId);
      if (portalChannel) {
        portalChannel.send(
          `**${channel.guild.name}** \`${channel.guild.id}\` has left the portal.`
        );
      }
    });

    await portal.updateServerStatus(channel.guildId, PortalRequest.left);
    const server = await Server.get(channel.guild.id);
    const dashboard = await server.dashboardChannel(channel.client);

    if (!dashboard) {
      console.log("No traffic channel found");
      return;
    }
    dashboard.send(
      `**${channel.guild.name}** \`${channel.guild.id}\` has left the portal ${
        portal?.name
      }. [executer : ${
        author ? `${author.toString()} \`${author.id}\`` : "`Unknown`"
      } ]`
    );
  },
};
