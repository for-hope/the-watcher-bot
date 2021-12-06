import { CommandInteraction } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";
import { commandHelpEmbed } from "../utils/bot_embeds";

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
        .setRequired(false)
    ),
  async execute(interaction: CommandInteraction) {
    const command = interaction.options.getString("command");
    interaction.reply({ embeds: [commandHelpEmbed(interaction.client)] });
  },
};
