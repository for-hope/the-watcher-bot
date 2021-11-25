import { CommandInteraction, GuildTextBasedChannel } from "discord.js";
import { getAdminRoles } from "../db/serversClient";
import { portalRequestAction } from "./actions/portalRequestActions";
import { portalRequestEmbed } from "./embeds/portalRequestEmbed";
export class PortalViews {
  public static async request(
    interaction: CommandInteraction,
    channel: GuildTextBasedChannel,
    invitedGuildId: string
  ) {
    const row = portalRequestAction();

    const embed = await portalRequestEmbed(interaction, channel);

    const adminRoles = await getAdminRoles(invitedGuildId);

    const adminRolePings = adminRoles
      ? adminRoles.map((role) => `<@&${role}>`)
      : "";
    return {
      content: `${adminRolePings} :bell: You got a new message!`,
      embeds: [embed],
      components: [row],
    };
  }
}
