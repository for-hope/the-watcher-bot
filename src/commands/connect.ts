import { CommandInteraction } from "discord.js";

import { slashCommand } from "../cmds";
import { ConnectCommand } from "../executions/ConnectCmd";

module.exports = {
  data: slashCommand(ConnectCommand.COMMAND),
  async execute(interaction: CommandInteraction) {
    const connectCommand = new ConnectCommand(interaction);
    if (!(await connectCommand.validateAndReply())) return;
    try {
      await connectCommand.execute();
    } catch (e) {
      console.log(e);
      connectCommand.failureReply();
    }
  },
};
