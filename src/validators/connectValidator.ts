import { CommandInteraction, Guild, GuildTextBasedChannel } from "discord.js";
import { portalByServersChannelId, PortalRequest } from "../db/portalClient";
import { hasManagerPermission } from "../utils/permissions";
import { getGuild } from "../utils/bot_utils";
import { getTrafficChannel } from "../db/serversClient";
//create class connect validator with constructor interaction
export class ConnectValidator {
  private interaction: CommandInteraction;
  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
  }

  public async validate(): Promise<boolean> {
    //check if the user is a member of the guild
    const channelToOpenPortalOn = this.interaction.options.getChannel(
      "channel"
    ) as GuildTextBasedChannel;
    const invitedGuildId = this.interaction.options.getString(
      "server_id"
    ) as string;

    if (!this.validateSameServer(invitedGuildId)) return false;
    if (!(await this.validateManagerPermission())) return false;
    if (
      !(await this.validatePortalChannel(
        channelToOpenPortalOn.id,
        invitedGuildId
      ))
    )
      return false;
    if (!(await this.validateOwnTrafficChannel(channelToOpenPortalOn.id)))
      return false;

    //

    return true; //check if the user is a member of the guild and has the required permissions
  }

  private validateSameServer(invitedGuildId: string): boolean {
    if (invitedGuildId === this.interaction.guildId) {
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

  private async validatePortalChannel(
    channelId: string,
    serverId: string
  ): Promise<boolean> {
    const portalChannel = await portalByServersChannelId(channelId);
    if (portalChannel) {
      const openInvite = portalChannel.openInvitation;
      if (!openInvite && portalChannel.originChannelId !== channelId) {
        this.interaction.reply(
          "The original creator of this portal doesn't allow invitations to other servers."
        );
        return false;
      }
      const portalServer = portalChannel.servers.find(
        (server) => server.server_id === serverId
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
              "This server is already pending approval on this portal channel. To cancel the request use `/cancel [server_id]`"
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

  private async validateOwnTrafficChannel(channelId: string): Promise<boolean> {
    const guild = this.interaction.guild as Guild;
    try {
      const trafficChannel = await getTrafficChannel(guild);
      if (trafficChannel.id === channelId) {
        this.interaction.reply(
          "You cannot connect to your own traffic channel."
        );
        return false;
      }
    } catch (e: any) {
      console.error(e);
      this.interaction.reply(
        "Your server isn't setup correctly to send and recieve portal connection requests. You must have a valid `traffic` channel. to setup the server use the slash command `/setup`"
      );
      return false;
    }

    return true;
  }
}
