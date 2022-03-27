import { TextChannel, Guild, MessageEmbed } from "discord.js";
import { botCommands } from "../cmds";
import { Portal } from "../db/portalClient";
import { portalServerMembersEmbed } from "../utils/bot_embeds";

import { PortalValidator } from "../validators/PortalValidator";

import { IValidationPerms, Validator } from "../validators/Validator";
import TwCmd, { ICmdStatic } from "./TWCmd";

export const MembersCommand: ICmdStatic = class MembersCmd extends TwCmd {
  static COMMAND = botCommands.members;
  DEFAULT_ERROR_MESSAGE: string = "There was an error displaying members.";
  private _successEmbed: MessageEmbed | null = null;
  private _channelPortal: TextChannel | null = null;
  validationPerms: IValidationPerms = {
    botPermFlags: [],
    userPermFlags: [],
    customPermFlags: [Validator.FLAGS.IS_SERVER_SETUP],
  };

  args = () => {
    const args = MembersCommand.COMMAND.args;
    const interactionOptions = this.interaction.options;
    this._channelPortal = interactionOptions.getChannel(
      args.channel.name
    ) as TextChannel | null;
    if (!this._channelPortal) {
      this._channelPortal = this.interaction.channel as TextChannel;
    }
  };

  successReply(): Promise<void> {
    if (!this._successEmbed) {
      this._invalidReply(this.DEFAULT_ERROR_MESSAGE);
      return Promise.resolve();
    }
    return this.guildManager.replyWithEmbed(this._successEmbed!, false);
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
    if (!portalExists.isValid || !portal)
      return this._invalidReply(portalExists.message);
    const servers = portal.servers;
    const serverIds = servers.map((server) => server.id);
    const mutedServerIds = serverIds.filter((serverId) =>
      portal.isServerMuted(serverId)
    );
    const ownerServer = portal.originServerId;
    const guildsById = serverIds.map((serverId) =>
      this.interaction.client.guilds.cache.get(serverId)
    );
    //filter null guild
    const nonNullGuilds = guildsById.filter(
      (guild) => guild !== null && guild !== undefined
    ) as Guild[];

    this._successEmbed = portalServerMembersEmbed(
      this.interaction.client,
      nonNullGuilds,
      mutedServerIds,
      ownerServer,
      portal.name
    );

    return true;
  };
};
