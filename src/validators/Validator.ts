import {
  CommandInteraction,
  GuildMemberRoleManager,
  Permissions,
  Role,
} from "discord.js";
import { botCommands } from "../cmds";
import { IServerDocument, Server } from "../db/serversClient";
import { PortalValidator } from "./PortalValidator";
import { ServerValidator } from "./ServerValidator";

export interface IValidation {
  isValid: boolean;
  message: string;
}

export interface IValidationPerms {
  botPermFlags: bigint[];
  userPermFlags: bigint[];
  customPermFlags: number[];
}

export interface ICustomValidators {
  serverValidator?: ServerValidator;
  portalValidator?: PortalValidator;
}

export class Validator {
  public static FLAGS = {
    IS_SERVER_NOT_SETUP: 0,
    IS_SERVER_SETUP: 1,
    BOT_MANAGER_ROLE: 2,
    IS_DIFFERENT_SERVER: 3,
  };

  private interaction: CommandInteraction;
  private server: Promise<IServerDocument>;
  private validationPerms: IValidationPerms = {
    botPermFlags: [],
    userPermFlags: [],
    customPermFlags: [],
  };

  private customValidators: ICustomValidators = {};

  constructor(
    interaction: CommandInteraction,
    validationPerms: IValidationPerms,
    customValidators?: ICustomValidators
  ) {
    this.interaction = interaction;
    this.validationPerms = validationPerms;
    this.server = Server.get(this.interaction?.guildId!);
    if (customValidators) {
      this.customValidators = customValidators;
    }
  }

  private _serverSetupIs = async (setup?: boolean): Promise<IValidation> => {
    const notValidMessage = `This server has not been setup yet. Please run /${botCommands.setup.name} to get started.`;
    try {
      const server = await this.server;
      const dashboard = await server.dashboardChannel();
      return {
        //true if opposite is false and dashboard exists or opposite is true and dashboard does not exist
        isValid: setup ? !!dashboard : !dashboard,
        message: dashboard ? "Server is already setup." : notValidMessage,
      };
    } catch (e) {
      return {
        isValid: setup ? false : true,
        message: notValidMessage,
      };
    }
  };

  private _botManagerRole = async (): Promise<IValidation> => {
    const server = await this.server;
    let adminRoleIds = server.adminRoles;
    if (!adminRoleIds) {
      return {
        isValid: false, //todo  add add  admin role  command
        message: `This server doesn't have any admin roles. Only server managers can use this command.`,
      };
    }
    const roles = this.interaction?.member?.roles as GuildMemberRoleManager;
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

  private _validateFlag = async (flag: number): Promise<IValidation> => {
    const flagMap: { [key: number]: IValidation } = {
      [Validator.FLAGS.IS_SERVER_NOT_SETUP]: await this._serverSetupIs(false),
      [Validator.FLAGS.IS_SERVER_SETUP]: await this._serverSetupIs(true),
      [Validator.FLAGS.BOT_MANAGER_ROLE]: await this._botManagerRole(),
    };
    const serverValidation = this.customValidators.serverValidator
      ? await this.customValidators.serverValidator.validateFlag(flag)
      : null;
    const portalValidation = this.customValidators.portalValidator
      ? await this.customValidators.portalValidator.validateFlag(flag)
      : null;
    return (
      flagMap[flag] ||
      serverValidation ||
      portalValidation || {
        isValid: true,
        message: `Permission ${flag} doesn't exist. this is most likely a bug.`,
      }
    );
  };

  public hasBotPermissions = async (): Promise<IValidation> => {
    const permissions = new Permissions(this.validationPerms.botPermFlags);
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
  public hasUserPermissions = async (): Promise<IValidation> => {
    const permissions = new Permissions(this.validationPerms.userPermFlags);
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
  public hasCustomPermissions = async (): Promise<IValidation> => {
    const flags = this.validationPerms.customPermFlags;
    const validations = await Promise.all(
      flags.map((flag) => this._validateFlag(flag))
    );
    const isValid = validations.every((validation) => validation.isValid);
    const message = validations
      .map((validation) => validation.message)
      .join("\n");
    return {
      isValid,
      message,
    };
  };
  public validate = async (): Promise<IValidation> => {
    const botPerms = await this.hasBotPermissions();
    if (!botPerms.isValid) return botPerms;
    const userPerms = await this.hasUserPermissions();
    if (!userPerms.isValid) return userPerms;
    const customPerms = await this.hasCustomPermissions();
    if (!customPerms.isValid) return customPerms;
    return {
      isValid: true,
      message: "",
    };
  };
}
