import { ButtonInteraction, CommandInteraction } from "discord.js";
import { ClientExpended } from "../index";
export const commandInteraction = async (
  interaction: CommandInteraction | ButtonInteraction
): Promise<void> => {
  if (!interaction.isCommand()) return;

  //get commands from the interaction
  const client = interaction.client as ClientExpended;
  const command: any = client.commands?.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
};
