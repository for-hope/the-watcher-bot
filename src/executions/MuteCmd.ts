import { Guild, MessageEmbed, Permissions, TextChannel } from "discord.js";
import ms from "ms";
import { botCommands } from "../cmds";
import { Portal } from "../db/portalClient";
import { Server } from "../db/serversClient";
import { TWGuildManager } from "../managers/TWGuildManager";
import {
  bannedServerEmbed,
  mutedServerEmbed,
  successfullyBannedEmbed,
  successfullyMutedEmbed,
} from "../utils/bot_embeds";
import { PortalValidator } from "../validators/PortalValidator";
import { IValidationPerms, Validator } from "../validators/Validator";
import TwCmd, { ICmdStatic } from "./TWCmd";

export const MuteCommand: ICmdStatic = class MuteCommand extends TwCmd {
  static COMMAND = botCommands.mute;
  DEFAULT_ERROR_MESSAGE: string = "There was an error muting the server.";
  validationPerms: IValidationPerms = {
    botPermFlags: [],
    userPermFlags: [Permissions.FLAGS.MANAGE_CHANNELS],
    customPermFlags: [Validator.FLAGS.BOT_MANAGER_ROLE],
  };

  private serverIdToMute: string = "";
  private channelWithPortal: TextChannel | null = null;
  private duration: string = "";
  private reason: string | null = null;
  private _successEmbed: MessageEmbed | null = null;
  args = () => {
    const args = botCommands.ban.args;
    const interactionOptions = this.interaction.options;
    this.serverIdToMute =
      interactionOptions.getString(args.serverId.name) || "";
    this.duration =
      interactionOptions.getString(args.duration.name) || "1 month";
    this.reason = interactionOptions.getString(args.reason.name);
    this.channelWithPortal =
      (interactionOptions.getChannel(
        args.channel.name
      ) as TextChannel | null) || (this.interaction?.channel! as TextChannel);
  };

  successReply = async (): Promise<void> => {
    if (!this._successEmbed) return;

    await this.guildManager.replyWithEmbed(this._successEmbed);
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
    const canBan = await portalValidator.canMute(this.serverIdToMute);
    if (!canBan.isValid) return this._invalidReply(canBan.message);
    const durationInMs = ms(this.duration);
    if (!durationInMs) {
      this.interaction.reply(
        ":x: The duration you provided is not valid, please use a valid duration ex: 5d, 5h, 5m, 5s for 5 days, 5 hours, 5 minutes, 5 seconds"
      );
      return false;
    }
    const newPortal = await portal?.muteServer(
      this.serverIdToMute,
      durationInMs
    );
    if (!newPortal || !portal)
      return this._invalidReply(this.DEFAULT_ERROR_MESSAGE);
    const server = await Server.get(this.serverIdToMute);
    const dashboard = await server.dashboardChannel();
    if (!dashboard) {
      return true;
    }
    TWGuildManager.sendEmbed(
      dashboard,
      mutedServerEmbed(
        this.interaction,
        durationInMs,
        this.interaction.guild as Guild,
        portal?.name
      )
    );

    this._successEmbed = successfullyMutedEmbed(
      this.interaction,
      durationInMs,
      this.serverIdToMute,
      this.channelWithPortal
    );

    return true;
  };
};
