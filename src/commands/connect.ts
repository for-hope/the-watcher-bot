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

import {
  CommandInteraction,
  GuildTextBasedChannel,
  Guild,
  TextChannel,
} from "discord.js";
import { ChannelType } from "discord-api-types/payloads/v9";
import { getGuild } from "../utils/bot_utils";
import { ConnectValidator } from "../validators/connectValidator";
import { portalRequestEmbed } from "../views/embeds/portalRequestEmbed";
import { portalRequestAction } from "../views/actions/portalRequestActions";

const CONNECT_COMMAND = "/connect";

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
    const connectCommand = new ConnectValidator(interaction);

    if (!(await connectCommand.validate())) {
      return;
    }

    const portal = await connectCommand.createOrGetPortal();

    const trafficChannel = connectCommand.trafficChannel as TextChannel;
    console.log(`Invited Guild : ${connectCommand.invitedGuild}`);
    const connectionRequestStatusMessage = await trafficChannel.send({
      embeds: [
        CONNECTION_REQUEST_SENT(
          interaction,
          PortalRequest.pending,
          connectCommand.invitedGuild as Guild
        ),
      ],
    });
    await connectCommand.inviteServer(connectionRequestStatusMessage.id);

    await interaction.reply(
      PORTAL_REQUEST_SENT(connectCommand.invitedGuild as Guild, trafficChannel)
    );
  },
};
