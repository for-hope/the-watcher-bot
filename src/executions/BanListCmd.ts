import { TextChannel } from "discord.js";
import { botCommands } from "../cmds";
import { Portal } from "../db/portalClient";
import { portalServerBannedMembersEmbed } from "../utils/bot_embeds";

import { PortalValidator } from "../validators/PortalValidator";
import { IValidationPerms, Validator } from "../validators/Validator";
import TwCmd, { ICmdStatic } from "./TWCmd";

export const BanListCommand: ICmdStatic = class BanListCmd extends TwCmd {
  static COMMAND = botCommands.banList;
  DEFAULT_ERROR_MESSAGE: string = "There was an error displaying the banlist.";
  private _channelPortal: TextChannel | null = null;
  private _portalName: string = "";
  private _bannedServerIds: string[] = [];
  validationPerms: IValidationPerms = {
    botPermFlags: [],
    userPermFlags: [],
    customPermFlags: [Validator.FLAGS.BOT_MANAGER_ROLE],
  };

  args = () => {
    const args = botCommands.banList.args;
    const interactionOptions = this.interaction.options;
    this._channelPortal = interactionOptions.getChannel(
      args.channel.name
    ) as TextChannel | null;
  };

  successReply(): Promise<void> {
    return this.guildManager.replyWithEmbed(
      portalServerBannedMembersEmbed(
        this.interaction.client,
        this._bannedServerIds,
        this._portalName
      ),
      true
    );
  }
  public execute = async (): Promise<boolean> => {
    if (!this._channelPortal)
      return this._invalidReply("Error: Invalid channel.");

    const portal = await Portal.getByChannelId(this._channelPortal.id);
    const portalValidator = new PortalValidator(
      portal,
      this.interaction.guildId!
    );
    const portalExists = portalValidator.portalExists();
    if (!portalExists.isValid) return this._invalidReply(portalExists.message);
    const isPortalOwner = portalValidator.serverOwner();
    if (!isPortalOwner.isValid)
      return this._invalidReply(isPortalOwner.message);

    const bannedServers = portal?.bannedServers;
    if (!bannedServers)
      return this._invalidReply("There are no banned servers in this portal.");
    this._portalName = portal?.name;
    this._bannedServerIds = bannedServers;
    await this.successReply();
    return true;
  };
};
