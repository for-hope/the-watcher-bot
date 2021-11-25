import { TextChannel } from "discord.js";
import { getTrafficChannel } from "../db/serversClient";

import { portalByServersChannelId, PortalRequest } from "../db/portalClient";
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

    const trafficChannel = await getTrafficChannel(channel.guild);
    trafficChannel.send(
      `**${channel.guild.name}** \`${channel.guild.id}\` has left the portal ${
        portal?.name
      }. [executer : ${
        author ? `${author.toString()} \`${author.id}\`` : "`Unknown`"
      } ]`
    );

    await portal.updateServerStatus(PortalRequest.left);
  },
};
