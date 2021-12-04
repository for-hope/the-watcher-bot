import { CommandInteraction } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "Displays a list of the available commands and interactions."
    )
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription(
          "The name of the command you want to get more information about."
        )
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const command = interaction.options.getString("command");
    interaction.reply(`soon`);
  },
};
