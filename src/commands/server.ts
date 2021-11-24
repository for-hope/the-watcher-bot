import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Guild } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("server")
  .setDescription("Replies with server info!");
export async function execute(interaction: CommandInteraction) {
  const guild = interaction.guild as Guild;
  await interaction.reply(
    `Server name: ${guild.name}\nTotal members: ${guild.memberCount}`
  );
}
