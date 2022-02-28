import { CommandInteraction } from "discord.js";

import { slashCommand } from "../cmds";
import { BanListCommand } from "../executions/BanListCmd";

module.exports = {
  data: slashCommand(BanListCommand.COMMAND),
  async execute(interaction: CommandInteraction) {
    const banListCommand = new BanListCommand(interaction);
    if (!(await banListCommand.validateAndReply())) return;
    try {
      await banListCommand.execute();
    } catch (e) {
      banListCommand.failureReply();
    }
  },
};
