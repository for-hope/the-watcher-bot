import {
  CommandInteraction,
  ButtonInteraction,
  GuildTextBasedChannel,
  User,
  Guild,
  ClientUser,
  MessageEmbed,
} from "discord.js";
import { getServerIdsOnPortal } from "../../db/portalClient";
import { getGuild } from "../../utils/bot_utils";

export const portalRequestEmbed = async (
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
