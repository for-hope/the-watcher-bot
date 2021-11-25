import { PortalRequest } from "../db/portalClient";
import {
  CommandInteraction,
  MessageEmbed,
  GuildMember,
  Guild,
  ClientUser,
} from "discord.js";
import { PortalRequestEmojis } from "./decoration";

export const CONNECTION_REQUEST_STATUS = (portalRequest: PortalRequest) => {
  const portalRequestString = portalRequest
    .toString()
    .toLowerCase() as keyof typeof PortalRequestEmojis;
  return `${portalRequest} ${PortalRequestEmojis[portalRequestString]}`;
};

export const CONNECTION_REQUEST_SENT = (
  interaction: CommandInteraction,
  portalRequest: PortalRequest,
  invitedGuild: Guild
): MessageEmbed => {
  //create embed
  const author = interaction.member as GuildMember;
  const guild = invitedGuild;
  const clientUser = guild.client.user as ClientUser;

  return new MessageEmbed()
    .setColor(0x0099ff)
    .setAuthor(
      `${author.user.tag}`,
      author.user.avatarURL() || author.user.defaultAvatarURL
    )
    .setTitle(`:cyclone: Portal Request - ${guild.toString()}`)
    .setDescription(
      `📩 A Connection request has been successfully sent to:
       **${guild.toString()}**\`${guild.id}\`\n`
    )
    .setFields({
      name: "Status",
      value: CONNECTION_REQUEST_STATUS(portalRequest),
    })
    .setTimestamp()
    .setThumbnail(guild.iconURL() as string) //TODO test
    .setFooter(
      `${clientUser.tag}`,
      clientUser.avatarURL() || clientUser.defaultAvatarURL
    );
};

