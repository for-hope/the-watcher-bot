import { SlashCommandBuilder } from "@discordjs/builders";

import { getTrafficChannel, getAdminRoles } from "../db/serversClient";
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
  ButtonInteraction,
  CommandInteraction,
  GuildTextBasedChannel,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  ClientUser,
  Guild,
  User,
} from "discord.js";
import { ChannelType } from "discord-api-types/payloads/v9";
import { Validators } from "../utils/validators";
import { getGuild } from "../utils/bot_utils";
import { ConnectValidator } from "../validators/connectValidator";

export enum PortalResponses {
  approve = "PortalApprove",
  deny = "PortalDeny",
}

const CONNECT_COMMAND = "/connect";

const channelToSend = async (
  interaction: CommandInteraction | ButtonInteraction,
  serverId: string
): Promise<GuildTextBasedChannel> => {
  let server: Guild;
  try {
    server = getGuild(interaction.client, serverId);
  } catch (e: any) {
    throw new Error(e.message);
  }

  //send message to server in a channel called border-control
  try {
    const trafficChannel = await getTrafficChannel(server);
    if (!trafficChannel) {
      throw new Error(
        "I can't find a traffic channel in the server! Please let them know to `/setup` the bot correctly."
      );
    }
    return trafficChannel;
  } catch (e) {
    throw new Error(
      "I can't find a traffic channel in the server! Please let them know to `/setup` the bot correctly."
    );
  }
};

const messageActionRow = () => {
  return new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(PortalResponses.approve)
      .setLabel("Approve")
      .setStyle("SUCCESS"),
    new MessageButton()
      .setCustomId(PortalResponses.deny)
      .setLabel("Deny")
      .setStyle("DANGER")
  );
};

const embedMessage = async (
  interaction: CommandInteraction | ButtonInteraction,
  channel: GuildTextBasedChannel
) => {
  const author = interaction.member.user as User;
  const guild = interaction.guild as Guild;
  const clientUser = interaction.client.user as ClientUser;
  const embed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(`${author.tag} \`${author.id}\``)
    .setDescription(
      `**${author.username}** wants to open a portal connection on
      \`#${channel.name}\``
    )
    .setAuthor(guild.name, guild.iconURL() as string | undefined)
    .setTimestamp()
    .setFooter(clientUser.tag, clientUser.avatarURL() as string | undefined);
  //get servers in portal
  const guildIds = await getServerIdsOnPortal(channel.id);
  const servers = guildIds.map((id) => getGuild(interaction.client, id));

  servers.push(guild);

  const uniqueServers = servers.filter(
    (server, index, self) => index === self.findIndex((t) => t.id === server.id)
  );

  const serverNames = uniqueServers.map((server) => server.name);

  const serverIds = uniqueServers.map((server) => server.id);
  const fieldNames = serverNames.map(
    (name, index) => `${name} \`${serverIds[index]}\``
  );
  embed.addFields({
    name: "Servers",
    value: fieldNames.join("\n"),
  });

  return embed;
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

    const channelToOpenPortalOn = interaction.options.getChannel(
      "channel"
    ) as GuildTextBasedChannel;
    const serverId = interaction.options.getString("server_id") as string;

    let invitedGuild: Guild;

    try {
      invitedGuild = getGuild(interaction.client, serverId);
      await sendPortalRequest(interaction, serverId, channelToOpenPortalOn);
    } catch (e: any) {
      interaction.reply(e.message);
      return;
    }

    const trafficChannel = await getTrafficChannel(interaction.guild as Guild);
    let connectionRequestMessageId = "";

    if (!trafficChannel) {
      interaction.reply(SELF_NO_TRAFFIC_CHANNEL);
    } else {
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
    }
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

const sendPortalRequest = async (
  interaction: CommandInteraction,
  serverId: string,
  channel: GuildTextBasedChannel
): Promise<void> => {
  //Get the other server's border channel.
  const borderChannel = await channelToSend(interaction, serverId);
  if (!borderChannel) {
    return;
  }

  //setup connection request message action row "Approve" / "Deny"
  const row = messageActionRow();
  //setup embed
  const embed = await embedMessage(interaction, channel);

  const adminRoles = await getAdminRoles(borderChannel.guildId);
  console.log(adminRoles);
  const adminRolePings = adminRoles
    ? adminRoles.map((role) => `<@&${role}>`)
    : "";

  //send a request to the border-control channel

  const message = await borderChannel.send({
    content: `${adminRolePings} :bell: You got a new message!`,
    embeds: [embed],
    components: [row],
  });

  const filter = (i: ButtonInteraction) =>
    i.customId === PortalResponses.approve ||
    i.customId === PortalResponses.deny;

  portalRequestCollector(filter, message, channel);
};
