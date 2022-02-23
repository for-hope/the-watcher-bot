import { SlashCommandBuilder } from "@discordjs/builders";
import { botCommands, ICommandArgs, SlashCommandOptions } from "../cmds";
import { ExtendSlashCommandBuilder } from "../slash";

const cmd = botCommands.setup;

export const setupSlashCommand = () => {
  const command = new ExtendSlashCommandBuilder()
    .setName(cmd.name)
    .setDescription(cmd.description);
  command.addArgs(cmd.args);
  return command;
};
