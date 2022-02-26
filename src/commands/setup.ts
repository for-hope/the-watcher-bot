import { CommandInteraction } from "discord.js";
import { slashCommand } from "../cmds";
import { SetupCommand } from "../executions/SetupCmd";
module.exports = {
  data: slashCommand(SetupCommand.COMMAND),
  async execute(interaction: CommandInteraction) {
    const setupCommand = new SetupCommand(interaction);
    if (!(await setupCommand.validateAndReply())) return;
    const executed = await setupCommand.execute();
    executed ? setupCommand.successReply() : setupCommand.failureReply();
  },
};
