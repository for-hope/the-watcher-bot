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

import { addOrUpdateServerOnPortal, PortalRequest } from "../db/portalClient";
import { hasManagerPermission } from "../utils/permissions";

import {
  getOrCreateBotCategory,
  PORTALS_CATEGORY_NAME,
} from "../utils/bot_utils";
import { PortalResponses } from "../types/portal";
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
    console.log(i.customId);
    const hasPerms = await hasManagerPermission(i);
    if (!hasPerms) {
      return;
    }
    const guild = i.guild as Guild;
    if (i.customId === PortalResponses.approve) {
      const multiverseCategory = (
        await getOrCreateBotCategory(guild, PORTALS_CATEGORY_NAME)
      ).category;

      //create the channel
      const portalChannel = await guild.channels.create(channel.name, {
        type: "GUILD_TEXT",
        parent: multiverseCategory as CategoryChannel,
      });
      //mention the channel
      const channelMention = portalChannel.toString();
      const channelIdsOnPortal = await addOrUpdateServerOnPortal(
        channel.id,
        portalChannel.id,
        i.guildId,
        PortalRequest.approved,
        null,
        null,
        i.client
      );

      channelIdsOnPortal.forEach(async (channelId) => {
        const channelById = i.client.channels.cache.find(
          (clientChannel) => clientChannel.id === channelId
        ) as GuildTextBasedChannel;
        await channelById.send(
          `:white_check_mark: **${i.user.tag}** from **${guild.name}** approved the portal request! You may now use this channel to communicate between servers.`
        );
      });

      await i.update({
        content: "✅ **Portal request approved!** on " + channelMention,
        components: [],
      });
    } else if (i.customId === PortalResponses.deny) {
      const channelIdsOnPortal = await addOrUpdateServerOnPortal(
        channel.id,
        "",
        i.guildId,
        PortalRequest.denied,
        null,
        null,
        i.client
      );
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
