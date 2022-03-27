import { CommandInteraction } from "discord.js";

import { slashCommand } from "../cmds";
import { MuteCommand } from "../executions/MuteCmd";


module.exports = {
  data: slashCommand(MuteCommand.COMMAND),
  async execute(interaction: CommandInteraction) {
    const membersCommand = new MuteCommand(interaction);
    if (!(await membersCommand.validateAndReply())) return;
    try {
      await membersCommand.execute();
    } catch (e) {
      membersCommand.failureReply();
    }
  },
};
