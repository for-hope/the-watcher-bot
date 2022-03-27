import { CommandInteraction } from "discord.js";

import { slashCommand } from "../cmds";
import { LeaveCommand } from "../executions/LeaveCmd";

module.exports = {
  data: slashCommand(LeaveCommand.COMMAND),
  async execute(interaction: CommandInteraction) {
    const leaveCommand = new LeaveCommand(interaction);
    if (!(await leaveCommand.validateAndReply())) return;
    try {
      await leaveCommand.execute();
    } catch (e) {
      leaveCommand.failureReply();
    }
  },
};
