import { CommandInteraction } from "discord.js";

import { slashCommand } from "../cmds";
import { BanCommand } from "../executions/BanCmd";

module.exports = {
  data: slashCommand(BanCommand.COMMAND),
  async execute(interaction: CommandInteraction) {
    const banCommand = new BanCommand(interaction);
    if (!(await banCommand.validateAndReply())) return;
    const executed = await banCommand.execute();
    executed ? banCommand.successReply() : banCommand.failureReply();
  },
};
 