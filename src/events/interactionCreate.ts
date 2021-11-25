import { commandInteraction } from "../interactions/command";
import { buttonInteraction } from "../interactions/buttons";
import { ButtonInteraction, CommandInteraction } from "discord.js";

module.exports = {
  name: "interactionCreate",
  async execute(
    interaction: ButtonInteraction | CommandInteraction
  ): Promise<void> {
    commandInteraction(interaction);
    buttonInteraction(interaction);
  },
};
