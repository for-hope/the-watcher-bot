import {
  ButtonInteraction,
  CacheType,
  CategoryChannel,
  CollectorFilter,
  Guild,
  GuildTextBasedChannel,
  Message,
  MessageComponentInteraction,
} from "discord.js";

import {
  addOrUpdateServerOnPortal,
  portalByServersChannelId,
  PortalRequest,
} from "../db/portalClient";
import { hasManagerPermission } from "../utils/permissions";

import {
  getOrCreateBotCategory,
  getTextChannel,
  PORTALS_CATEGORY_NAME,
} from "../utils/bot_utils";
import { PortalResponses } from "../types/portal";
import { getServerById } from "../db/serversClient";
//TODO setup collectors correctly
export const portalRequestCollector = (
  message: Message,
  channel: GuildTextBasedChannel
) => {
  const filter: any = (i: ButtonInteraction) =>
    i.customId === PortalResponses.approve ||
    i.customId === PortalResponses.deny;
  const collector = message.createMessageComponentCollector({
    filter,
  });

  collector.on("collect", async (i: ButtonInteraction) => {
    const hasPerms = await hasManagerPermission(i);
    if (!hasPerms) {
      return;
    }
    const guild = i.guild as Guild;
    const portal = await portalByServersChannelId(channel.id);
    if (!portal) {
      //error
      return;
    }

    if (i.customId === PortalResponses.approve) {
      const multiverseCategory = (
        await getOrCreateBotCategory(guild, PORTALS_CATEGORY_NAME)
      ).category;

      //create the channel
      const portalChannel = await guild.channels.create(channel.name, {
        type: "GUILD_TEXT",
        parent: multiverseCategory as CategoryChannel,
      });

      const portal = await portalByServersChannelId(channel.id);
      if (!portal) {
        //error
        return;
      }

      //mention the channel
      const channelMention = portalChannel.toString();

      const updatedPortal = await portal.approveServerRequest(
        i.guildId,
        portalChannel.id
      );

      updatedPortal.validChannelIds().forEach(async (channelId) => {
        console.log(channelId);
        const channelById = getTextChannel(i.client, channelId);
        if (!channelById) {
          return;
        }
        await channelById.send(
          `:white_check_mark: **${i.user.tag}** from **${guild.name}** approved the portal request! You may now use this channel to communicate between servers.`
        );
      });

      await i.update({
        content: "✅ **Portal request approved!** on " + channelMention,
        components: [],
      });
    } else if (i.customId === PortalResponses.deny) {
      portal.denyServerRequest(i.guildId);
      await i.update({
        content: "❌ Portal request denied",
        components: [],
      });

      //create channel
    } else {
      await i.reply("Something went wrong");
    }
  });

  collector.on("end", (collected) => {
    console.log(`Collected ${collected.size} interactions.`);
  });
};
