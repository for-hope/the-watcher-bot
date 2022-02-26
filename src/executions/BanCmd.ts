import { Guild, Permissions, TextChannel } from "discord.js";
import { botCommands } from "../cmds";
import { Portal } from "../db/portalClient";
import { Server } from "../db/serversClient";
import { TWGuildManager } from "../managers/guild-manager";
import {
  bannedServerEmbed,
  successfullyBannedEmbed,
} from "../utils/bot_embeds";
import { PortalValidator } from "../validators/PortalValidator";
import { IValidationPerms, Validator } from "../validators/Validator";
import TwCmd, { ICmdStatic } from "./TWCmd";

export const BanCommand: ICmdStatic = class BanCommand extends TwCmd {
  static COMMAND = botCommands.ban;
  DEFAULT_ERROR_MESSAGE: string = "There was an error banning the user.";
  validationPerms: IValidationPerms = {
    botPermFlags: [],
    userPermFlags: [Permissions.FLAGS.MANAGE_CHANNELS],
    customPermFlags: [Validator.FLAGS.BOT_MANAGER_ROLE],
  };

  private serverIdToBan: string = "";
  private channelWithPortal: TextChannel | null = null;
  private banReason: string | null = null;
  args = () => {
    const args = botCommands.ban.args;
    const interactionOptions = this.interaction.options;
    this.serverIdToBan = interactionOptions.getString(args.serverId.name) || "";
    this.banReason = interactionOptions.getString(args.reason.name);
    this.channelWithPortal =
      (interactionOptions.getChannel(
        args.channel.name
      ) as TextChannel | null) || (this.interaction?.channel! as TextChannel);
  };

  successReply = async (): Promise<void> => {
    await this.guildManager.replyWithEmbed(
      successfullyBannedEmbed(
        this.interaction,
        this.serverIdToBan,
        this.channelWithPortal!
      )
    );
  };

  private _optionalMessage = async (
    channel: TextChannel | null,
    isImportant?: boolean
  ): Promise<boolean> => {
    if (!channel) {
      return !isImportant;
    }
    const sent = await TWGuildManager.sendEmbed(
      channel,
      bannedServerEmbed(
        this.interaction,
        this.interaction.guild as Guild,
        this.channelWithPortal!.name
      )
    );
    return !!sent;
  };

  public execute = async (): Promise<boolean> => {
    //todo refactor errors
    if (!this.channelWithPortal)
      return this._invalidReply("Error: Invalid channel.");

    const portal = await Portal.getByChannelId(this.channelWithPortal.id);
    const portalValidator = new PortalValidator(
      portal,
      this.interaction.guildId!
    );
    const canBan = await portalValidator.canBan(this.serverIdToBan);
    if (!canBan.isValid) return this._invalidReply(canBan.message);

    const newPortal = await portal?.banServer(this.serverIdToBan);
    if (!newPortal) return this._invalidReply(this.DEFAULT_ERROR_MESSAGE);

    const bannedServer = await Server.get(this.serverIdToBan);
    const bannedServerDashboard = await bannedServer.dashboardChannel();
    this._optionalMessage(bannedServerDashboard);

    return true;
  };
};
