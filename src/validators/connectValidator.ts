import {
  CommandInteraction,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  TextChannel,
} from "discord.js";
import {
  createServerOnPortal,
  IPortalDocument,
  portalByServersChannelId,
  PortalRequest,
} from "../db/portalClient";
import { hasManagerPermission } from "../utils/permissions";
import { getGuild, getTextChannel } from "../utils/bot_utils";
import { getServerById, IServerDocument } from "../db/serversClient";
import {
  NO_COMMAND_PERMISSON,
  OPEN_INVITES_DISABLED,
  OTHER_SERVER_NOT_SETUP,
  PORTAL_ALREADY_CONNECTED,
  PORTAL_CONNECT_TRAFFIC,
  PORTAL_CREATE_UNKNOWN_ERROR,
  PORTAL_PENDING_APPROVAL,
  PORTAL_SERVER_BANNED,
  SELF_NO_TRAFFIC_CHANNEL,
  SELF_SERVER_NOT_SETUP,
} from "../utils/bot_error_message";
import { failedMessageEmbed } from "../utils/bot_embeds";

export class ConnectValidator {
  private interaction: CommandInteraction;
  public channelToOpenPortalOn: GuildTextBasedChannel;
  public trafficChannel: TextChannel | null | undefined;
  public invitedGuildId: string;
  public server: IServerDocument | undefined;
  public invitedServer: IServerDocument | undefined;
  public invitedGuild: Guild | undefined;
  public invitedGuildTrafficChannel: TextChannel | null | undefined;
  public portal: IPortalDocument | undefined;

  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
    this.channelToOpenPortalOn = this.interaction.options.getChannel(
      "channel"
    ) as GuildTextBasedChannel;
    this.invitedGuildId = this.interaction.options.getString(
      "server_id"
    ) as string;
  }

  public async validate(): Promise<boolean> {
    //check if the user is a member of the guild

    if (!this.validateSameServer()) return false;
    if (!(await this.validateManagerPermission())) return false;
    if (!this.validateInvitedGuild()) return false;
    if (!(await this.validateServersOnDb())) return false;
    if (!(await this.validatePortalChannel())) return false;
    if (!(await this.validateOwnTrafficChannel())) return false;
    if (!this.validateInvitedGuildTrafficChannel) return false;

    return true; //check if the user is a member of the guild and has the required permissions
  }

  private validateBannedServer(): boolean {
    if (this.portal?.isServerBlacklisted(this.invitedGuildId)) {
      this.interaction.reply(PORTAL_SERVER_BANNED);
      return false;
    }
    return true;
  }

  private validateSameServer(): boolean {
    if (this.invitedGuildId === this.interaction.guildId) {
      this.errReply("You cannot connect to your own server.");
      return false;
    }
    return true;
  }

  private async validateManagerPermission(): Promise<boolean> {
    if (!(await hasManagerPermission(this.interaction))) {
      this.errReply(NO_COMMAND_PERMISSON);
    }
    return true;
  }

  private async validatePortalChannel(): Promise<boolean> {
    const portalChannel = await portalByServersChannelId(
      this.channelToOpenPortalOn.id
    );
    if (portalChannel) {
      this.portal = portalChannel;
      const openInvite = portalChannel.openInvitation;
      if (
        !openInvite &&
        portalChannel.originChannelId !== this.channelToOpenPortalOn.id
      ) {
        this.errReply(OPEN_INVITES_DISABLED);
        return false;
      }
      const portalServer = portalChannel.servers.find(
        (server) => server.server_id === this.invitedGuildId
      );
      if (portalServer) {
        const serverState = portalServer.server_status;

        switch (serverState) {
          case PortalRequest.approved:
            this.errReply(PORTAL_ALREADY_CONNECTED);
            return false;
          case PortalRequest.pending:
            this.errReply(PORTAL_PENDING_APPROVAL);
            return false;
          case PortalRequest.banned:
            this.errReply(PORTAL_SERVER_BANNED);
            return false;
          default:
            return true;
        }
      }
    }
    return true;
  }

  private async validateOwnTrafficChannel(): Promise<boolean> {
    try {
      const id = this.server?.trafficChannelId;
      if (id) {
        const trafficChannel = getTextChannel(this.interaction.client, id);
        if (trafficChannel) {
          if (trafficChannel.id === this.channelToOpenPortalOn.id) {
            this.errReply(PORTAL_CONNECT_TRAFFIC);
            return false;
          }
          this.trafficChannel = trafficChannel;
          return true;
        }
      }
      throw new Error(SELF_NO_TRAFFIC_CHANNEL);
    } catch (e: any) {
      console.error(e);
      this.errReply(SELF_NO_TRAFFIC_CHANNEL);
      return false;
    }
  }

  private async validateServersOnDb(): Promise<boolean> {
    this.server = await getServerById(this.interaction.guildId);
    this.invitedServer = await getServerById(this.invitedGuildId);
    if (!this.server) {
      this.errReply(SELF_SERVER_NOT_SETUP);
      return false;
    }
    if (!this.invitedServer) {
      this.errReply(OTHER_SERVER_NOT_SETUP);

      return false;
    }
    return true;
  }

  private validateInvitedGuild(): boolean {
    try {
      this.invitedGuild = getGuild(
        this.interaction.client,
        this.invitedGuildId
      );

      if (!this.invitedGuild) {
        throw new Error("No guild");
      }
      return true;
    } catch (e) {
      this.errReply(OTHER_SERVER_NOT_SETUP);

      return false;
    }
  }

  private validateInvitedGuildTrafficChannel(): boolean {
    const trafficChannelId = (this.invitedServer as IServerDocument)
      .trafficChannelId;
    if (!trafficChannelId) {
      this.errReply(OTHER_SERVER_NOT_SETUP);

      return false;
    }
    this.invitedGuildTrafficChannel = getTextChannel(
      this.interaction.client,
      trafficChannelId
    );
    if (!this.invitedGuildTrafficChannel) {
      this.errReply(OTHER_SERVER_NOT_SETUP);
      return false;
    }
    return true;
  }

  public async createOrGetPortal(): Promise<IPortalDocument | null> {
    if (this.portal) {
      return this.portal;
    }
    const portal = await createServerOnPortal(
      this.channelToOpenPortalOn.name,
      this.interaction,
      this.channelToOpenPortalOn.id
    );
    if (!portal) {
      this.errReply(PORTAL_CREATE_UNKNOWN_ERROR);

      return null;
    }

    this.portal = portal;
    return portal;
  }

  public async inviteServer(requestStatusMsgId: string): Promise<boolean> {
    await this.invitedServer?.invite(
      this.interaction,
      this.channelToOpenPortalOn
    );

    if (!this.portal) {
      this.errReply(PORTAL_CREATE_UNKNOWN_ERROR);
      return false;
    }
    await this.portal.addServerRequest(
      this.invitedGuildId,
      requestStatusMsgId,
      this.server?.trafficChannelId as string
    );

    return true;
  }

  private errReply = (msg: string) => {
    this.interaction.reply({
      embeds: [
        failedMessageEmbed(
          this.interaction.client,
          this.interaction.member as GuildMember,
          msg
        ),
      ],
    });
  };
}
