import { SlashCommandBuilder } from "@discordjs/builders";
import {
  CommandInteraction,
  GuildTextBasedChannel,
  CategoryChannel,
  Role,
} from "discord.js";
import { addServerToDimension } from "../db/dimensionClient";
import { hasManagerPermission } from "../utils/permissions";
import { getOrCreateBotCategory } from "../utils/bot_utils";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("teleport")
    .setDescription("teleport to a multi dimension channel!")
    .addStringOption((option) =>
      option
        .setName("dimension")
        .setDescription(
          "Name of the global dimension you want to teleport to, example: Music"
        )
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription(
          "Only allow users with this role to view and talk in the dimension channel"
        )
        .setRequired(false)
    ),

  async execute(interaction: CommandInteraction) {
    const hasPerms = await hasManagerPermission(interaction);
    if (!hasPerms) return;

    const dimensionName = interaction.options.getString("dimension");
    const roleOnly = interaction.options.getRole("role") as Role;

    let multiverseCategory = (
      await getOrCreateBotCategory(interaction.guild, "multiverse")
    ).category;

    //create the channel
    const portalChannel: GuildTextBasedChannel =
      await interaction.guild.channels.create(dimensionName, {
        type: "GUILD_TEXT",
        parent: multiverseCategory,
      });

    if (roleOnly) {
      await portalChannel.permissionOverwrites.edit(roleOnly, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
        READ_MESSAGE_HISTORY: true,
      });
    }
    //set portalChannel permissions that roleOnly can see and talk in
    //mention the channel
    const channelMention = portalChannel.toString();
    //add to dbClient
    await addServerToDimension(
      dimensionName,
      portalChannel.guildId,
      portalChannel.id
    );
    await interaction.reply(
      `Teleported to the global dimension #${dimensionName}, You can start chatting with servers on that dimension here : ${channelMention}`
    );
  },
};
