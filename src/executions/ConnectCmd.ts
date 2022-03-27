import {
  CommandInteraction,
  GuildManager,
  GuildTextBasedChannel,
  Permissions,
  TextChannel,
  User,
} from "discord.js";
import { botCommands } from "../cmds";
import { Portal, PortalRequest } from "../db/portalClient";
import { Server } from "../db/serversClient";
import { TWGuildManager } from "../managers/TWGuildManager";
import { CONNECTION_REQUEST_SENT, infoMessageEmbed } from "../utils/bot_embeds";
import { PORTAL_REQUEST_SENT } from "../utils/bot_messages";
import { getGuild } from "../utils/bot_utils";
import { PortalValidator } from "../validators/PortalValidator";
import { ServerValidator } from "../validators/ServerValidator";
import {
  ICustomValidators,
  IValidationPerms,
  Validator,
} from "../validators/Validator";
import TwCmd, { ICmdStatic } from "./TWCmd";

export const ConnectCommand: ICmdStatic = class ConnectCommand extends TwCmd {
  public static COMMAND = botCommands.connect;
  DEFAULT_ERROR_MESSAGE: string = "There was an error connecting the server.";

  private _serverIdToConnect: string = "";
  private _channelToConnectOn: TextChannel | null = null;

  private _dashboardChannel: GuildTextBasedChannel | null = null;

  validationPerms: IValidationPerms = {
    botPermFlags: [Permissions.FLAGS.MANAGE_CHANNELS],
    userPermFlags: [Permissions.FLAGS.MANAGE_CHANNELS],
    customPermFlags: [
      Validator.FLAGS.BOT_MANAGER_ROLE,
      Validator.FLAGS.IS_SERVER_SETUP,
      ServerValidator.FLAGS.SERVER_SETUP,
      ServerValidator.FLAGS.DIFFERENT_SERVER,
      ServerValidator.FLAGS.SERVER_EXISTS_BOT,
    ],
  };
  customValidators: ICustomValidators = {
    serverValidator: new ServerValidator(
      this.interaction,
      this._serverIdToConnect
    ),
  };

  args = () => {
    const args = botCommands.connect.args;
    const interactionOptions = this.interaction.options;
    this._serverIdToConnect =
      interactionOptions.getString(args.serverId.name) || "";
    this._channelToConnectOn =
      (interactionOptions.getChannel(
        args.channel.name
      ) as TextChannel | null) || (this.interaction?.channel! as TextChannel);
  };
  successReply(): Promise<void> {
    if (!this._dashboardChannel) {
      return Promise.resolve();
    }
    return this.guildManager.replyWithEmbed(
      infoMessageEmbed(
        this.interaction.client,
        this.interaction?.member?.user as User,
        PORTAL_REQUEST_SENT(
         getGuild(this.interaction.client, this._serverIdToConnect),
          this._dashboardChannel!
        )
      )
    );
  }
  execute = async (): Promise<boolean> => {
    let portal = await Portal.getByChannelId(this.interaction.channel!.id);
    if (portal) {
      const portalValidator = new PortalValidator(
        portal,
        this.interaction.guildId!
      );
      const isNotBanned = await portalValidator.isNotBanned();
      if (!isNotBanned.isValid) return this._invalidReply(isNotBanned.message);
    }
    if (!portal && this._channelToConnectOn) {
      portal = await Portal.newPortal(
        this.interaction,
        this._channelToConnectOn
      );
    }
    if (!portal)
      return this._invalidReply("Error: while creating a portal connection.");

    const server = await Server.get(this.interaction.guildId!);
    const dashboard = (await server.dashboardChannel()) as TextChannel;
    const requestMsg = await TWGuildManager.sendEmbed(
      dashboard,
      CONNECTION_REQUEST_SENT(
        this.interaction,
        PortalRequest.pending,
        getGuild(this.interaction.client, this.interaction.guildId!)
      )
    );

    const invitedServer = await Server.get(this._serverIdToConnect);
    invitedServer.invite(this.interaction, this._channelToConnectOn!);
    await portal.addServerRequest(
      this._serverIdToConnect,
      requestMsg.id,
      server.dashboardChannelId as string
    );



    return true;
  };
};
