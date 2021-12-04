import { SlashCommandBuilder } from "@discordjs/builders";

import { PortalRequest } from "../db/portalClient";

import { CONNECTION_REQUEST_SENT, infoMessageEmbed } from "../utils/bot_embeds";
import { PORTAL_REQUEST_SENT } from "../utils/bot_messages";

import {
  CommandInteraction,
  Guild,
  GuildMember,
  TextChannel,
  User,
} from "discord.js";
import { ChannelType } from "discord-api-types/payloads/v9";

import { ConnectValidator } from "../validators/connectValidator";

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

    await connectCommand.createOrGetPortal();

    const trafficChannel = connectCommand.trafficChannel as TextChannel;

    const connectionRequestStatusMessage = await trafficChannel.send({
      embeds: [
        CONNECTION_REQUEST_SENT(
          interaction,
          PortalRequest.pending,
          connectCommand.invitedGuild as Guild
        ),
      ],
    });
    console.log("inviting server...");
    await connectCommand.inviteServer(connectionRequestStatusMessage.id);

    await interaction.reply({
      embeds: [
        infoMessageEmbed(
          interaction.client,
          interaction.member.user as User,
          PORTAL_REQUEST_SENT(
            connectCommand.invitedGuild as Guild,
            trafficChannel
          )
        ),
      ],
    });
  },
};
