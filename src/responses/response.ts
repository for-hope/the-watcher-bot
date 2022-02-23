import { CommandInteraction } from "discord.js";

class CommandResponse {
  private interaction: CommandInteraction;
  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
  }
}
