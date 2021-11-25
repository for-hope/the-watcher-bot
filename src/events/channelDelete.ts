import { GuildChannel, TextChannel, User } from "discord.js";
import { getTrafficChannel } from "../db/serversClient";

import {
  IPortalServer,
  portalByServersChannelId,
  PortalRequest,
  IPortalDocument,
} from "../db/portalClient";
import {
  getOriginChannelId,
  getChannelIdsOnPortal,
  getServerIdsOnPortal,
} from "../db/portalClient";

module.exports = {
  name: "channelDelete",
  async execute(channel: TextChannel) {
    //check if channel is on portal
    console.log(`channelDelete: ${channel.name}`);
    const originChannelId = await getOriginChannelId(channel.id);
    if (!originChannelId) {
      return;
    }
    const channelIdsOnPortal = await getChannelIdsOnPortal(originChannelId);
    if (!channelIdsOnPortal) {
      return;
    }

    const portal = (await portalByServersChannelId(
      channel.id
    )) as IPortalDocument;

    const logs = await channel.guild.fetchAuditLogs({ type: "CHANNEL_DELETE" });

    const author = logs.entries.find(
      (entry) => (entry.target as GuildChannel).id === channel.id
    )?.executor as User | undefined;

    channelIdsOnPortal.forEach(async (channelId) => {
      const portalChannel = channel.client.channels.cache.get(
        channelId
      ) as TextChannel;
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

    await portal.updateServerStatus(PortalRequest.left);
    // const serverObj = portal.servers.find(
    //   (server) => server.server_id === channel.guild.id
    // ) as IPortalServer;

    // const updatedServerObj: IPortalServer = {
    //   ...serverObj,
    //   server_status: PortalRequest.left,
    // };
    // const portalServers = portal.servers.filter(
    //   (server) => server.server_id !== channel.guild.id
    // );
    // portalServers.push(updatedServerObj);
    // const updatedPortal: IPortal = {
    //   ...portal,
    //   servers: portalServers as any,
    // };

    // await updatePortal(updatedPortal);
  },
};
