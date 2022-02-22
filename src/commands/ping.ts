import { CommandInteraction } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";
import ms from "ms";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction: CommandInteraction) {
    await interaction.reply(
      `Pong! 🏓\nAPI Latency: \`${interaction.client.ws.ping}ms\``
    );
  },
};
