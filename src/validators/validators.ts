import {
  ButtonInteraction,
  CommandInteraction,
  GuildMemberRoleManager,
  Permissions,
  Role,
} from "discord.js";
import { botCommands } from "../cmds";
import { getAdminRoles, getTrafficChannel } from "../db/serversClient";

export interface IValidation {
  isValid: boolean;
  message: string;
  replyEvenIfValid?: boolean; // it means show a message even if it's valid
}

export class Validator {
  constructor(private interaction: CommandInteraction) {
    this.interaction = interaction;
  }

  public serverSetup = async (): Promise<IValidation> => {
    try {
      const traffic = await getTrafficChannel(this.interaction.guild!);
      return {
        isValid: !!traffic,
        message: "Server is already setup.",
      };
    } catch (e) {
      return {
        isValid: false,
        message: `This server has not been setup yet. Please run /${botCommands.setup.name} to get started.`,
      };
    }
  };

  public botPermissions = async (perms: bigint[]): Promise<IValidation> => {
    const permissions = new Permissions(perms);
    const hasPerms = !!this.interaction.guild?.me?.permissions.has(permissions);
    return {
      isValid: hasPerms,
      message: hasPerms
        ? "Bot has required permissions."
        : `Bot does not have required permissions. [${permissions
            .toArray()
            .join(", ")}`,
    };
  };

  public userPermissions = async (perms: bigint[]): Promise<IValidation> => {
    const permissions = new Permissions(perms);
    const hasPerms = !!this.interaction.memberPermissions?.has(permissions);
    return {
      isValid: hasPerms,
      message: hasPerms
        ? "User has required permissions."
        : `User does not have required permissions. [${permissions
            .toArray()
            .join(", ")}`,
    };
  };

  public botManagerRole = async (
    interaction: CommandInteraction | ButtonInteraction
  ): Promise<IValidation> => {
    let adminRoleIds = await getAdminRoles(interaction.guild!.id);
    if (!adminRoleIds) {
      return {
        isValid: false, //todo  add add  admin role  command
        message: `This server doesn't have any admin roles. Only server managers can use this command.`,
      };
    }
    const roles = interaction?.member?.roles as GuildMemberRoleManager;
    const hasPerms = roles.cache.some((role: Role) =>
      adminRoleIds!.includes(role.id)
    );
    return {
      isValid: hasPerms,
      message: hasPerms
        ? "User has required permissions."
        : `User does not have required permission roles. [${adminRoleIds!.join(
            ", "
          )}]`,
    };
  };
}
