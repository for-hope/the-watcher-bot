import { PortalRequest } from "../db/portalClient";
import {
  CommandInteraction,
  MessageEmbed,
  GuildMember,
  Guild,
} from "discord.js";

export const CONNECTION_REQUEST_SENT = (
  interaction: CommandInteraction,
  portalRequest: PortalRequest
): MessageEmbed => {
  //create embed
  const author = interaction.member as GuildMember;
  const guild: Guild = interaction.guild;
  return new MessageEmbed()
    .setColor(0x0099ff)
    .setAuthor(`${author.user.tag}`, author.user.avatarURL())
    .setTitle(`:cyclone: Connection Request - ${guild.toString()}`)
    .setDescription(
      `:electric_plug: A Connection request has been successfully sent to **${guild.toString()}**\`${
        guild.id
      }\`\n`
    )
    .setFields({
      name: "Status",
      value: `${portalRequest}`,
    })
    .setTimestamp()
    .setFooter(`${guild.client.user.username}`, author.guild.iconURL());
};
