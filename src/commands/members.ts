import { CommandInteraction } from "discord.js";

import { slashCommand } from "../cmds";
import { MembersCommand } from "../executions/MembersCmd";

module.exports = {
  data: slashCommand(MembersCommand.COMMAND),
  async execute(interaction: CommandInteraction) {
    const membersCommand = new MembersCommand(interaction);
    if (!(await membersCommand.validateAndReply())) return;
    try {
      await membersCommand.execute();
    } catch (e) {
      membersCommand.failureReply();
    }
  },
};
