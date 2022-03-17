import { CommandInteraction } from "discord.js";
import { IBotCommand } from "../cmds";
import { TWGuildManager } from "../managers/guild-manager";
import { failedMessageEmbed } from "../utils/bot_embeds";
import {
  ICustomValidators,
  IValidationPerms,
  Validator,
} from "../validators/Validator";

export interface ICmdStatic {
  new (interaction: CommandInteraction): TwCmd;
  COMMAND: IBotCommand;
}

export default abstract class TwCmd {
  interaction: CommandInteraction;
  validationPerms: IValidationPerms = {
    botPermFlags: [],
    userPermFlags: [],
    customPermFlags: [],
  };

  customValidators: ICustomValidators = {};

  validator: Validator;
  guildManager: TWGuildManager;

  abstract DEFAULT_ERROR_MESSAGE: string;
  abstract args(): void;
  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
    this.args();
    this.validator = new Validator(
      interaction,
      this.validationPerms,
      this.customValidators
    );
    this.guildManager = new TWGuildManager(this.interaction);
  }

  _invalidReply = async (message: string): Promise<boolean> => {
    await this.interaction.reply({
      content: message,
      ephemeral: true,
    });
    return false;
  };

  public async validateAndReply(): Promise<boolean> {
    const validation = await this.validator.validate();
    if (!validation.isValid) {
      await this._invalidReply(validation.message);
      return false;
    }
    return true;
  }

  async failureReply(): Promise<void> {
    await this.guildManager.replyWithEmbed(
      failedMessageEmbed(
        this.interaction.client,
        this.interaction.user!,
        this.DEFAULT_ERROR_MESSAGE
      )
    );
  }

  abstract successReply(): Promise<void>;
  abstract execute: () => Promise<boolean>;
}
