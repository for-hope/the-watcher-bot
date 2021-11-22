import { commandInteraction } from "../interactions/command";
import { buttonInteraction } from '../interactions/buttons';

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    commandInteraction(interaction);
    buttonInteraction(interaction);

  },
};
