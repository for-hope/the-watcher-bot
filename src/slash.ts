//add method to SlashCommandBuilder
import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types/payloads/v9";
import { ICommandArgs, SlashCommandOptions } from "./cmds";
export class ExtendSlashCommandBuilder extends SlashCommandBuilder {
  constructor() {
    super();
  }

  addArgs(argsMap: { [key: string]: ICommandArgs }) {
    const builder = this;
    const argKeys = Object.keys(argsMap);
    const args = argKeys.map((key) => argsMap[key]);

    args.forEach((arg: ICommandArgs) => {
      switch (arg.type) {
        case SlashCommandOptions.CHANNEL:
          builder.addChannelOption((option) =>
            option
              .setName(arg.name)
              .setDescription(arg.description)
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(!!arg.required)
          );
          break;
        case SlashCommandOptions.ROLE:
          builder.addRoleOption((option) =>
            option
              .setName(arg.name)
              .setDescription(arg.description)
              .setRequired(!!arg.required)
          );
          break;
        case SlashCommandOptions.BOOLEAN:
          builder.addBooleanOption((option) =>
            option
              .setName(arg.name)
              .setDescription(arg.description)
              .setRequired(!!arg.required)
          );
          break;
        case SlashCommandOptions.STRING:
          builder.addStringOption((option) =>
            option
              .setName(arg.name)
              .setDescription(arg.description)
              .setRequired(!!arg.required)
          );
          break;
        case SlashCommandOptions.NUMBER:
          builder.addNumberOption((option) =>
            option
              .setName(arg.name)
              .setDescription(arg.description)
              .setRequired(!!arg.required)
          );
          break;
        case SlashCommandOptions.INTEGER:
          builder.addIntegerOption((option) =>
            option
              .setName(arg.name)
              .setDescription(arg.description)
              .setRequired(!!arg.required)
          );
          break;
        case SlashCommandOptions.MENTIONABLE:
          builder.addMentionableOption((option) =>
            option
              .setName(arg.name)
              .setDescription(arg.description)
              .setRequired(!!arg.required)
          );
          break;
        case SlashCommandOptions.USER:
          builder.addUserOption((option) =>
            option
              .setName(arg.name)
              .setDescription(arg.description)
              .setRequired(!!arg.required)
          );
          break;
      }
    });
  }
}
