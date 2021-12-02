import { PortalRequest } from "../db/portalClient";
import {
  CommandInteraction,
  MessageEmbed,
  GuildMember,
  Guild,
  ClientUser,
  Client,
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

export const failedMessageEmbed = (
  client: Client,
  member: GuildMember,
  failedMessage: string
) => {
  return (
    new MessageEmbed()
      //set color error
      .setAuthor(
        member.user.tag,
        member.user.avatarURL() || member.user.defaultAvatarURL
      )

      .setColor(0xff555f)
      .setDescription(failedMessage)
      .setTimestamp()
      .setFooter(
        client.user?.tag as string,
        client?.user?.avatarURL() as string
      )
  );
};

export const infoMessageEmbed = (
  client: Client,
  member: GuildMember,
  infoMessage: string
) => {
  return (
    new MessageEmbed()
      //set color error
      .setAuthor(
        member.user.tag,
        member.user.avatarURL() || member.user.defaultAvatarURL
      )

      .setColor(0x0099ff)
      .setDescription(infoMessage)
      .setTimestamp()
      .setFooter(
        client.user?.tag as string,
        client?.user?.avatarURL() as string
      )
  );
};
