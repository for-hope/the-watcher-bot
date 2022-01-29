import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types/payloads/v9";
import { CommandInteraction, Guild, TextChannel } from "discord.js";
import { portalServerMembersEmbed } from "../utils/bot_embeds";
import { portalByServersChannelId } from "../db/portalClient";

export const data = new SlashCommandBuilder()
  .setName("members")
  .setDescription("Replies with a list of server members in a portal channel")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Specify the channel to open a connection on")
      .addChannelType(ChannelType.GuildText)
      .setRequired(false)
  );

export async function execute(interaction: CommandInteraction) {
  const guild = interaction.guild as Guild;
  const channel = interaction.channel as TextChannel;
  const portalChannel = await portalByServersChannelId(channel.id);
  if (!portalChannel) {
    interaction.reply("You must be in a portal channel to use this command!");
    return;
  }

  const servers = portalChannel.servers;
  const serverIds = servers.map((server) => server.server_id);
  const guildsById = serverIds.map((serverId) =>
    interaction.client.guilds.cache.get(serverId)
  );
  //filter null guild
  const nonNullGuilds = guildsById.filter(
    (guild) => guild !== null && guild !== undefined
  ) as Guild[];

  const embedReply = portalServerMembersEmbed(
    interaction.client,
    nonNullGuilds,
    channel.name
  );

  interaction.reply({ embeds: [embedReply] });

  //get list of guilds in the portal
}
