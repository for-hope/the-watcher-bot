import { Guild } from "discord.js";

import {
  PortalRequest,
  portalsByServerId,
} from "../db/portalClient";
import { getTextChannel } from "../utils/bot_utils";

module.exports = {
  name: "guildDelete",
  async execute(guild: Guild) {
    const portals = await portalsByServerId(guild.id);
    if (!portals) return;

    portals.forEach(async (portal) => {
      const channelIdsOnPortal = portal.servers.map(
        (server) => server.channel_id
      );

      channelIdsOnPortal.forEach(async (channelId) => {
        const portalChannel = getTextChannel(guild.client, channelId);
        if (portalChannel) {
          portalChannel.send(
            `**${guild.name}** \`${guild.id}\` has left the portal.`
          );
        }
      });

      await portal.updateServerStatus(guild.id, PortalRequest.left);
    });
  },
};
