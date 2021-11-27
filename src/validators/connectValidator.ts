import {
  CommandInteraction,
  Guild,
  GuildTextBasedChannel,
  TextChannel,
} from "discord.js";
import {
  addOrUpdateServerOnPortal,
  createServerOnPortal,
  IPortalDocument,
  portalByServersChannelId,
  PortalRequest,
} from "../db/portalClient";
import { hasManagerPermission } from "../utils/permissions";
import { getGuild, getTextChannel } from "../utils/bot_utils";
import { getServerById, IServerDocument } from "../db/serversClient";

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

  private validateSameServer(): boolean {
    if (this.invitedGuildId === this.interaction.guildId) {
      this.interaction.reply("You cannot connect to your own server.");
      return false;
    }
    return true;
  }

  private async validateManagerPermission(): Promise<boolean> {
    if (!(await hasManagerPermission(this.interaction))) {
      this.interaction.reply(
        "You do not have the required permissions to use this command."
      );
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
        this.interaction.reply(
          "The original creator of this portal doesn't allow invitations to other servers."
        );
        return false;
      }
      const portalServer = portalChannel.servers.find(
        (server) => server.server_id === this.invitedGuildId
      );
      if (portalServer) {
        const serverState = portalServer.server_status;

        switch (serverState) {
          case PortalRequest.approved:
            this.interaction.reply(
              "This server is already connected to the portal."
            );
            return false;
          case PortalRequest.pending:
            this.interaction.reply(
              "This server is already pending approval on this portal channel. To cancel a request use `/cancel [server_id]`"
            );
            return false;
          case PortalRequest.banned:
            this.interaction.reply("This server is banned from the portal.");
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
            this.interaction.reply(
              "You cannot connect to your own traffic channel."
            );
            return false;
          }
          this.trafficChannel = trafficChannel;
          return true;
        }
      }
      throw new Error("No traffic channel");
    } catch (e: any) {
      console.error(e);
      this.interaction.reply(
        "Your server isn't setup correctly to send and recieve portal connection requests. You must have a valid `traffic` channel. to setup the server use the slash command `/setup`"
      );
      return false;
    }
  }

  private async validateServersOnDb(): Promise<boolean> {
    this.server = await getServerById(this.interaction.guildId);
    this.invitedServer = await getServerById(this.invitedGuildId);
    if (!this.server) {
      this.interaction.reply(
        "You are not setup to connect to other servers. To setup your server use the slash command `/setup`"
      );
      return false;
    }
    if (!this.invitedServer) {
      this.interaction.reply(
        "The server you are trying to connect to is not setup correctly to connect to other servers. To setup a server use the slash command `/setup`"
      );
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
      this.interaction.reply(
        "The server you are trying to connect to is not setup correctly to connect to other servers. To setup a server use the slash command `/setup`"
      );
      return false;
    }
  }

  private validateInvitedGuildTrafficChannel(): boolean {
    const trafficChannelId = (this.invitedServer as IServerDocument)
      .trafficChannelId;
    if (!trafficChannelId) {
      this.interaction.reply(
        "The server you are trying to connect to is not setup correctly to connect to other servers. To setup a server use the slash command `/setup`"
      );
      return false;
    }
    this.invitedGuildTrafficChannel = getTextChannel(
      this.interaction.client,
      trafficChannelId
    );
    if (!this.invitedGuildTrafficChannel) {
      this.interaction.reply(
        "The server you are trying to connect to is not setup correctly to connect to other servers. To setup a server use the slash command `/setup`"
      );
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
      this.interaction.reply(
        "There was an error creating the portal. Please try again later."
      );
      return null;
    }
    return portal;
  }

  public async inviteServer(requestStatusMsgId: string): Promise<boolean> {
    await this.invitedServer?.invite(
      this.interaction,
      this.channelToOpenPortalOn
    );

    await addOrUpdateServerOnPortal(
      (this.portal as IPortalDocument).originChannelId,
      "",
      this.invitedGuildId,
      PortalRequest.pending,
      requestStatusMsgId,
      (this.trafficChannel as TextChannel).id,
      this.interaction.client
    );

    return true;
  }
}
