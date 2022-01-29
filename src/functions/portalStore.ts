import { CommandInteraction, TextChannel, User } from "discord.js";
import { getTrafficChannel } from "../db/serversClient";
import { IPortalDocument, PortalRequest } from "../db/portalClient";
import { getTextChannel } from "../utils/bot_utils";

export const leavePortal = async (
  portal: IPortalDocument,
  interaction: CommandInteraction

): Promise<void> => {
  const channel = interaction.channel as TextChannel;
  const author = interaction.user as User;
  const channelIdsOnPortal = portal.servers.map((server) => server.channel_id);

  channelIdsOnPortal.forEach(async (channelId) => {
    const portalChannel = getTextChannel(channel.client, channelId);
    if (portalChannel) {
      portalChannel.send(
        `**${channel.guild.name}** \`${channel.guild.id}\` has left the portal.`
      );
    }
  });

  const trafficChannel = await getTrafficChannel(channel.guild);
  trafficChannel.send(
    `**${channel.guild.name}** \`${channel.guild.id}\` has left the portal ${
      portal?.name
    }. [executer : ${
      author ? `${author.toString()} \`${author.id}\`` : "`Unknown`"
    } ]`
  );

  await portal.updateServerStatus(channel.guildId, PortalRequest.left);
  return;
};
