import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types/payloads/v9";
import { CommandInteraction, Guild, TextChannel } from "discord.js";
import { leftPortalEmbed } from "../utils/bot_embeds";
import { portalByServersChannelId } from "../db/portalClient";
import { leavePortal } from "../functions/portalStore";

export const data = new SlashCommandBuilder()
  .setName("leave")
  .setDescription("Leave a portal that you are in by channel")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Specify the channel to open a connection on")
      .addChannelType(ChannelType.GuildText)
      .setRequired(false)
  );
export async function execute(interaction: CommandInteraction) {
  const channel = (interaction.options.getChannel("channel") ||
    interaction.channel) as TextChannel;

  const portal = await portalByServersChannelId(channel.id);
  if (!portal) {
    interaction.reply("You must be in a portal channel to use this command!");
    return;
  }
  await leavePortal(portal, interaction);
  await interaction.reply(
    "You have left the portal! :wave: feel free to delete this channel if you want."
  );
  //send embed to channel
  await channel.send({
    embeds: [leftPortalEmbed(interaction)],
  });

  //
}
