import { Guild, User } from "discord.js";
import { infoMessageEmbed } from "../utils/bot_embeds";

import { PortalRequest, portalsByServerId } from "../db/portalClient";
import { getTextChannel } from "../utils/bot_utils";

module.exports = {
  name: "guildDelete",
  async execute(guild: Guild) {
    const portals = await portalsByServerId(guild.id);
    if (!portals) return;

    portals.forEach(async (portal) => {
      const channelIdsOnPortal = portal.servers.map((server) => {
        if (server.server_status === PortalRequest.approved) {
          return server.channel_id;
        }
      });

      if (!channelIdsOnPortal) return;
      channelIdsOnPortal.forEach(async (channelId) => {
        if (channelId) {
          const portalChannel = getTextChannel(guild.client, channelId);
          if (portalChannel) {
            portalChannel.send({
              embeds: [
                infoMessageEmbed(
                  guild.client,
                  guild.client.user as User,
                  `**${guild.name}** \`${guild.id}\` has left the portal. [reason : The Watcher Bot cannot access the server anymore.]`
                ),
              ],
            });
          }
        }
      });

      await portal.updateServerStatus(guild.id, PortalRequest.left);
    });
  },
};
