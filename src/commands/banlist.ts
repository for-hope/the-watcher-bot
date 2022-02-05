import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types/payloads/v9";
import { CommandInteraction, TextChannel } from "discord.js";
import { portalServerBannedMembersEmbed } from "../utils/bot_embeds";
import { portalByServersChannelId } from "../db/portalClient";

export const data = new SlashCommandBuilder()
  .setName("banlist")
  .setDescription(
    "Replies with a list of banned server members in a portal channel"
  )
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Specify the channel to open a connection on")
      .addChannelType(ChannelType.GuildText)
      .setRequired(false)
  );

export async function execute(interaction: CommandInteraction) {
  //get channel from options
  const channel = (interaction.options.getChannel("channel") ||
    interaction.channel) as TextChannel;
  const portalChannel = await portalByServersChannelId(channel.id);
  if (!portalChannel) {
    interaction.reply("You must be in a portal channel to use this command!");
    return;
  }

  const bannedServerIds = portalChannel.bannedServers;
 

  const embedReply = portalServerBannedMembersEmbed(
    interaction.client,
    bannedServerIds,
    channel.name
  );

  interaction.reply({ embeds: [embedReply], ephemeral: true });

  //get list of guilds in the portal
}
