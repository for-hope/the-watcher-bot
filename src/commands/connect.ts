import { SlashCommandBuilder } from "@discordjs/builders";

import { getTrafficChannel, getAdminRoles } from "../db/serversClient";
import { portalRequestCollector } from "../collectors/portalRequest";
import { createServerOnPortal } from "../db/portalClient";
import { hasManagerPermission } from '../utils/permissions';
import {
  BaseGuildTextChannel,
  ButtonInteraction,
  CommandInteraction,
  GuildTextBasedChannel,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";

export enum PortalResponses {
  approve = "PortalApprove",
  deny = "PortalDeny",
}

const channelToSend = async (
  interaction,
  serverId: String
): Promise<BaseGuildTextChannel | undefined> => {
  //check if bot is in the server by id
  const server = await interaction.client.guilds.fetch(serverId);
  if (!server) {
    interaction.reply("I'm not in that server!");
    return;
  }
  //send message to server in a channel called border-control
  const trafficChannel = await getTrafficChannel(server);
  if (!trafficChannel) {
    interaction.reply(
      "I can't find a traffic channel in the server! Please let them know to `/setup` the bot correctly."
    );
    return;
  }
  return trafficChannel;
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

const embedMessage = (interaction, channel) => {
  return new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(
      `${interaction.member.user.tag} \`${interaction.member.user.id}\``
    )
    .setDescription(
      `**${interaction.member.user.username}** wants to open a portal connection on
      \`#${channel.name}\``
    )
    .setAuthor(interaction.guild.name, interaction.guild.iconURL())
    .setTimestamp()
    .setFields({
      name: "Servers",
      value: `${interaction.guild.name} \`${interaction.guild.id}\``,
    })
    .setFooter(
      interaction.client.user.tag,
      interaction.client.user.avatarURL()
    );
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
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const hasPerms = await hasManagerPermission(interaction);
    if (!hasPerms) return;
    
    const channel = interaction.options.getChannel(
      "channel"
    ) as GuildTextBasedChannel;
    const serverId = interaction.options.getString("server_id");

    // Add server and other info into the database
    await createServerOnPortal(
      channel.name,
      interaction.user.id,
      interaction.guildId,
      channel.id
    );

    //Get the other server's border channel.
    const borderChannel = await channelToSend(interaction, serverId);
    if (!borderChannel) {
      return;
    }
    

    //setup connection request message action row "Approve" / "Deny"
    const row = messageActionRow();
    //setup embed
    const embed = embedMessage(interaction, channel);

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
    await interaction.reply("Done!");
  },
};
