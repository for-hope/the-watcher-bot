import { PortalRequest } from "../db/portalClient";
import {
  CommandInteraction,
  MessageEmbed,
  GuildMember,
  Guild,
  ClientUser,
  Client,
  User,
  GuildChannel,
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

export const commandHelpEmbed = (client: Client) => {
  return new MessageEmbed()
    .setColor(0x0099ff)

    .setAuthor(
      "TheWatcher Command Help",
      client.user?.avatarURL() || client.user?.defaultAvatarURL || "",
      "https://thewatcher.xyz"
    )
    .setDescription(
      `Use the Slash Command \`/help [command name]\` to get more command information on a specific command.`
    )
    .setFields(
      {
        name: ":cyclone: Inter-server communications",
        value: "`/setup` `/connect` `/leave` `/members`",
      },
      {
        name: ":tools: Portal Moderation",
        value: "`/ban` `/hardban` `/mute` `/unmute` `/purge` `/permissions`\n",
      },
      {
        name: ":information_source: Information",
        value: "`/help` `/info` `/ping` `/serverinfo`\n",
      },
      {
        name: ":tada: Fun",
        value: "`/8ball` `/coinflip` `/roll` `/choose`",
      },
      {
        name: ":test_tube: Experimental",
        value: `\`/teleport\`\n\n\n\n**Need More Help?**\nVisit the bot's website [here](https://thewatcher.xyz) or Join the [Support Server](https://discord.gg/) for more help.\n\n**<@${client.user?.id}> is controlled by users with Manage Server permissions.**`,
      }
    )
    .setFooter("thewatcher.xyz", client.user?.avatarURL() || "")
    .setTimestamp();
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
  member: User,
  infoMessage: string
) => {
  return (
    new MessageEmbed()
      //set color error
      .setAuthor(member.tag, member.avatarURL() || member.defaultAvatarURL)

      .setColor(0x0099ff)
      .setDescription(infoMessage)
      .setTimestamp()
      .setFooter(
        client.user?.tag as string,
        client?.user?.avatarURL() as string
      )
  );
};

export const portalServerMembersEmbed = (
  client: Client,
  servers: Guild[],
  channelName: string
): MessageEmbed => {
  return new MessageEmbed()
    .setColor(0x0099ff)
    .setAuthor(
      `Server Members in "${channelName}"`,
      client.user?.avatarURL() || client.user?.defaultAvatarURL
    )
    .setDescription(
      `**${servers.length} Servers**\n\n` +
        servers
          .map((server, index) => {
            return `${index + 1} - **${server.name}**\`${server.id}\`\n${
              server.memberCount
            } members`;
          })
          .join("\n")
    )
    .setTimestamp()
    .setFooter(
      "thewatcher.xyz",
      client.user?.avatarURL() || client.user?.defaultAvatarURL
    );
};

export const leftPortalEmbed = (
  interaction: CommandInteraction
): MessageEmbed => {
  const member = interaction.member as GuildMember;
  const guild = interaction.guild as Guild;
  const channel = interaction.channel as GuildChannel;
  const clientUser = guild.client.user as ClientUser;

  return new MessageEmbed()
    .setColor(0x0099ff)
    .setAuthor(
      `${member.user.tag}`,
      member.user.avatarURL() || member.user.defaultAvatarURL
    )
    .setTitle(`Left Portal`)
    .setDescription(
      `📩 You have successfully left the portal in 
       **${channel.name}**\`${channel.id}\`\n`
    )
    .setTimestamp()
    .setThumbnail(guild.iconURL() as string)
    .setFooter(
      `${clientUser.tag}`,
      clientUser.avatarURL() || clientUser.defaultAvatarURL
    );
};
