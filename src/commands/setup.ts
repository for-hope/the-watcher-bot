import { CommandInteraction } from "discord.js";
import { slashCommand } from "../cmds";
import { SetupCommand } from "../executions/SetupCmd";
module.exports = {
  data: slashCommand(SetupCommand.COMMAND),
  async execute(interaction: CommandInteraction) {
    const setupCommand = new SetupCommand(interaction);
    if (!(await setupCommand.validateAndReply())) return;
    try {
      await setupCommand.execute();
      //log execution
    } catch (e) {
      //console.log(e);
      setupCommand.failureReply();
    }
  },
};
