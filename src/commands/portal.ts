import { SlashCommandBuilder } from "@discordjs/builders";
import { hasManagerPermission } from "../utils/permissions";
import { getOrCreateBotCategory } from "../utils/bot_utils";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("portal")
    .setDescription(
      "Create a private realm and invite other server to communicate."
    )
    .addStringOption((option) =>
      option
        .setName("channel_name")
        .setDescription("The name of the realm channel to create.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const hasPerms = await hasManagerPermission(interaction);
    if (!hasPerms) return;
    const channelName = interaction.options.getString("channel_name");
    let multiverseCategory = (
      await getOrCreateBotCategory(interaction.guild, "multiverse")
    ).category;

    //create the channel
    const channel = await interaction.guild.channels.create(channelName, {
      type: "GUILD_TEXT",
      parent: multiverseCategory,
    });
    //mention the channel
    const channelMention = channel.toString();

    await interaction.reply(`Channel ${channelMention} created!`);
  },
};
