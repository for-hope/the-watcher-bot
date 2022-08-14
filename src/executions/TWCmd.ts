import { CommandInteraction } from "discord.js";
import { IBotCommand } from "../cmds";
import { TWGuildManager } from "../managers/TWGuildManager";
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

  customValidators: ICustomValidators | undefined;

  validator: Validator | undefined;
  guildManager: TWGuildManager;

  abstract DEFAULT_ERROR_MESSAGE: string;
  abstract args(): void;
  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
    this.args();
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
    this.validator = new Validator(
      this.interaction,
      this.validationPerms,
      this.customValidators
    );
    const validation = await this.validator.validate();

    if (!validation.isValid) {
      console.log(validation.message);
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
