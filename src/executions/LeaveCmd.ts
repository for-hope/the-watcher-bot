import { TextChannel, Permissions, User } from "discord.js";
import { botCommands } from "../cmds";
import { Portal } from "../db/portalClient";
import { Server } from "../db/serversClient";
import { leftPortalEmbed } from "../utils/bot_embeds";

import { PortalValidator } from "../validators/PortalValidator";

import { IValidationPerms, Validator } from "../validators/Validator";
import TwCmd, { ICmdStatic } from "./TWCmd";

export const LeaveCommand: ICmdStatic = class LeaveCmd extends TwCmd {
  static COMMAND = botCommands.leave;
  DEFAULT_ERROR_MESSAGE: string = "There was an error executing this command.";
  private _channelPortalToLeave: TextChannel | null = null;
  validationPerms: IValidationPerms = {
    botPermFlags: [Permissions.FLAGS.MANAGE_CHANNELS],
    userPermFlags: [Permissions.FLAGS.MANAGE_CHANNELS],
    customPermFlags: [
      Validator.FLAGS.BOT_MANAGER_ROLE,
      Validator.FLAGS.IS_SERVER_SETUP,
    ],
  };

  args = () => {
    const args = LeaveCommand.COMMAND.args;
    const interactionOptions = this.interaction.options;
    this._channelPortalToLeave = interactionOptions.getChannel(
      args.channel.name
    ) as TextChannel | null;
    if (!this._channelPortalToLeave) {
      this._channelPortalToLeave = this.interaction.channel as TextChannel;
    }
  };

  successReply(): Promise<void> {
    return this.guildManager.replyWithEmbed(leftPortalEmbed(this.interaction), true);
  }
  public execute = async (): Promise<boolean> => {
    if (!this._channelPortalToLeave)
      return this._invalidReply("Error: Invalid channel.");

    const portal = await Portal.getByChannelId(this._channelPortalToLeave.id);
    const portalValidator = new PortalValidator(
      portal,
      this.interaction.guildId!
    );
    const portalExists = portalValidator.portalExists();
    if (!portalExists.isValid) return this._invalidReply(portalExists.message);
    const isPortalOwner = portalValidator.serverOwner();
    if (!isPortalOwner.isValid)
      return this._invalidReply(isPortalOwner.message);

    const leftMessage = `**${this.interaction.guild?.name!}** \`${this
      .interaction.guild?.id!}\` has left the portal.`;
    await portal?.eventMessage(this.interaction.client, leftMessage);
    await portal?.leave(this.interaction.guildId!);

    const server = await Server.get(this.interaction.guildId!);
    const dashboard = await server.dashboardChannel();
    const author = this.interaction.user as User;
    if (dashboard) {
      dashboard.send(
        `**Your server has left the portal ${portal?.name}. [executer : ${
          author ? `${author.toString()} \`${author.id}\`` : "`Unknown`"
        } ]`
      );
    }

    return true;
  };
};
