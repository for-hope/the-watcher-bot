import {
  ButtonInteraction,
  CategoryChannel,
  Client,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  Message,
  User,
} from "discord.js";

import { portalByServersChannelId, PortalRequest } from "../db/portalClient";
import { hasManagerPermission } from "../utils/permissions";

import {
  getOrCreateBotCategory,
  getTextChannel,
  PORTALS_CATEGORY_NAME,
} from "../utils/bot_utils";
import { PortalResponses } from "../types/portal";

import { updateRequestStatusMessage } from "../services/portalService";
import { infoMessageEmbed } from "../utils/bot_embeds";

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

  collector.on("collect", async (interaction: ButtonInteraction) => {
    const hasPerms = await hasManagerPermission(interaction);
    if (!hasPerms) {
      return;
    }

    const guild = interaction.guild as Guild;
    const guildId = interaction.guildId as string;
    const portal = await portalByServersChannelId(channel.id);
    if (!portal) {
      //error
      return;
    }

    if (interaction.customId === PortalResponses.approve) {
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
        guildId,
        portalChannel.id
      );

      updatedPortal.validChannelIds().forEach(async (channelId) => {
        const channelById = getTextChannel(interaction.client, channelId);
        if (!channelById) {
          return;
        }
        await channelById.send({
          embeds: [
            infoMessageEmbed(
              interaction.client as Client,
              interaction.client.user as User,
              `:white_check_mark: **${interaction.user.tag}** from **${guild.name}** approved the portal request! You may now use this channel to communicate between servers.`
            ),
          ],
        });
      });

      await interaction.update({
        content: "✅ **Portal request approved!** on " + channelMention,
        components: [],
      });

      await updateRequestStatusMessage(
        interaction.client,
        portal.myServer(guildId),
        PortalRequest.approved
      );
    } else if (interaction.customId === PortalResponses.deny) {
      portal.denyServerRequest(guildId);
      await updateRequestStatusMessage(
        interaction.client,
        portal.myServer(guildId),
        PortalRequest.denied
      );
      await interaction.update({
        content: "❌ Portal request denied",
        components: [],
      });

      //create channel
    } else {
      await interaction.reply("Something went wrong");
    }
  });

  collector.on("end", (collected) => {
    console.log(`Collected ${collected.size} interactions.`);
  });
};
