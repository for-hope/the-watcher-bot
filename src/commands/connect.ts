import { SlashCommandBuilder } from "@discordjs/builders";

import {
  getTrafficChannel,
  getAdminRoles,
  getServerById,
} from "../db/serversClient";
import { portalRequestCollector } from "../collectors/portalRequest";
import {
  createServerOnPortal,
  PortalRequest,
  addOrUpdateServerOnPortal,
  getServerIdsOnPortal,
} from "../db/portalClient";
import { hasManagerPermission } from "../utils/permissions";
import { CONNECTION_REQUEST_SENT } from "../utils/bot_embeds";
import { PORTAL_REQUEST_SENT } from "../utils/bot_messages";

import { CommandInteraction, GuildTextBasedChannel, Guild } from "discord.js";
import { ChannelType } from "discord-api-types/payloads/v9";
import { getGuild } from "../utils/bot_utils";
import { ConnectValidator } from "../validators/connectValidator";
import { portalRequestEmbed } from "../views/embeds/portalRequestEmbed";
import { portalRequestAction } from "../views/actions/portalRequestActions";

const CONNECT_COMMAND = "/connect";

const invitedGuildTrafficChannel = async (
  interaction: CommandInteraction,
  serverId: string
): Promise<GuildTextBasedChannel> => {
  let server: Guild;
  try {
    server = getGuild(interaction.client, serverId);
    const trafficChannel = await getTrafficChannel(server);
    return trafficChannel;
  } catch (e: any) {
    throw new Error(e.message);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("connect")
    .setDescription(
      "Connect to a server or multiple servers in a private portal channel!"
    )
    .addStringOption((option) =>
      option
        .setName("server_id")
        .setDescription("The server id of the server you want to connect with")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Specify the channel to open a connection on")
        .addChannelType(ChannelType.GuildText)
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const connectValidator = new ConnectValidator(interaction);

    if (!(await connectValidator.validate())) {
      return;
    }

    //args
    //
    const channelToOpenPortalOn = interaction.options.getChannel(
      "channel"
    ) as GuildTextBasedChannel;
    const serverId = interaction.options.getString("server_id") as string;
    //
    //

    let invitedGuild: Guild;

    try {
      invitedGuild = getGuild(interaction.client, serverId);
      const server = await getServerById(serverId);
      await server?.invite(interaction, channelToOpenPortalOn);
    } catch (e: any) {
      console.error(e);
      interaction.reply(e.message);
      return;
    }

    let trafficChannel: GuildTextBasedChannel;
    let connectionRequestMessageId = "";
    try {
      trafficChannel = await getTrafficChannel(interaction.guild as Guild);
    } catch (e: any) {
      interaction.reply(SELF_NO_TRAFFIC_CHANNEL);
      return;
    }

    const connectionRequestStatusMessage = await trafficChannel.send({
      embeds: [
        CONNECTION_REQUEST_SENT(
          interaction,
          PortalRequest.pending,
          invitedGuild
        ),
      ],
    });
    connectionRequestMessageId = connectionRequestStatusMessage.id;

    await createServerOnPortal(
      channelToOpenPortalOn.name,
      interaction,
      channelToOpenPortalOn.id
    );
    await addOrUpdateServerOnPortal(
      channelToOpenPortalOn.id,
      "",
      serverId,
      PortalRequest.pending,
      connectionRequestMessageId,
      trafficChannel.id,
      interaction.client
    );
    await interaction.reply(PORTAL_REQUEST_SENT(invitedGuild, trafficChannel));
  },
};
