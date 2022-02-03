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
  TextChannel,
} from "discord.js";
import { PortalRequestEmojis } from "./decoration";
import { botCommands } from "../cmds";
import ms from "ms";

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
  mutedServers: string[],
  ownerServerId: string,
  channelName: string
): MessageEmbed => {
  const textStatus = (serverId: string) => {
    return mutedServers.includes(serverId)
      ? `:no_entry: muted`
      : serverId === ownerServerId
      ? `:star: owner`
      : `:white_check_mark:`;
  };
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
            return `${index + 1} - **${server.name}**\`${
              server.id
            }\` - ${textStatus(server.id)} \n${server.memberCount} members`;
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

export const commandEmbed = (
  client: Client,
  commandName: string
): MessageEmbed => {
  const commandInfo = botCommands.get(commandName);
  if (!commandInfo) {
    return new MessageEmbed().setColor(0xff0000).setTitle(`Command not found`);
  }

  const argsString = commandInfo.args
    .map(
      (arg) =>
        `\`${arg.name}\` - ${arg.description} - ${
          arg.required ? "Required" : "Optional"
        }`
    )
    .join(`\n`);

  return new MessageEmbed()
    .setColor(0x0099ff)
    .setTitle(`\`/${commandName}\` (Slash Command)`)
    .setDescription(
      `${commandInfo.description}\n\n**Usage:** \`${commandInfo.usage}\`
      \n**Aliases:** \`${commandInfo.aliases.join(", ")}\`
      \n**Long Description:** ${commandInfo.longDescription}
      \n**Args:**\n ${argsString}`
    )
    .setTimestamp()
    .setFooter(
      "Usage Syntax: <required> [optional]",
      client.user?.avatarURL() || client.user?.defaultAvatarURL
    );
};

export const bannedServerEmbed = (
  interaction: CommandInteraction,
  server: Guild,
  portalChannel: string
): MessageEmbed => {
  const member = interaction.member as GuildMember;
  const clientUser = interaction.client.user as ClientUser;

  return new MessageEmbed()
    .setColor(0xff3300)
    .setAuthor(
      `${member.user.tag}`,
      member.user.avatarURL() || member.user.defaultAvatarURL
    )
    .setTitle(`:hammer: Banned`)
    .setDescription(
      `:hammer: You have been muted in ${portalChannel} by **${server.name}**\`${server.id}\`\n`
    )
    .setTimestamp()
    .setFooter(
      `${clientUser.tag}`,
      clientUser.avatarURL() || clientUser.defaultAvatarURL
    );
};

export const mutedServerEmbed = (
  interaction: CommandInteraction,
  duration: number, //in MS
  server: Guild,
  portalChannel: string
): MessageEmbed => {
  const member = interaction.member as GuildMember;
  const clientUser = interaction.client.user as ClientUser;

  return (
    new MessageEmbed()
      //red
      .setColor(0xff3300)
      .setAuthor(
        `${member.user.tag}`,
        member.user.avatarURL() || member.user.defaultAvatarURL
      )
      .setTitle(`Muted`)
      .setDescription(
        `📩 You have been muted in ${portalChannel} by **${server.name}**\`${
          server.id
        }\`\n
      **Duration:** ${ms(duration, { long: true })}`
      )
      .setTimestamp()
      .setFooter(
        `${clientUser.tag}`,
        clientUser.avatarURL() || clientUser.defaultAvatarURL
      )
  );
};

export const unmutedServerEmbed = (
  interaction: CommandInteraction,
  server: Guild,
  portalChannel: string
): MessageEmbed => {
  const member = interaction.member as GuildMember;
  const clientUser = interaction.client.user as ClientUser;

  return (
    new MessageEmbed()
      //green
      .setColor(0x00ff33)
      .setAuthor(
        `${member.user.tag}`,
        member.user.avatarURL() || member.user.defaultAvatarURL
      )
      .setTitle(`Unmuted`)
      .setDescription(
        `📩 You have been unmuted in ${portalChannel} by **${server.name}**\`${server.id}\`\n`
      )
      .setTimestamp()
      .setFooter(
        `${clientUser.tag}`,
        clientUser.avatarURL() || clientUser.defaultAvatarURL
      )
  );
};

export const successfullyMutedEmbed = (
  interaction: CommandInteraction,
  duration: number, //in MS
  server_id: string,
  portalChannel: TextChannel
): MessageEmbed => {
  const member = interaction.member as GuildMember;
  const clientUser = interaction.client.user as ClientUser;

  return (
    new MessageEmbed()
      //blue
      .setColor(0x0099ff)
      .setAuthor(
        `${member.user.tag}`,
        member.user.avatarURL() || member.user.defaultAvatarURL
      )
      .setTitle(`Muted`)
      .setDescription(
        `📩 You have successfully muted \`${server_id}\` in ${portalChannel.toString()} for ${ms(
          duration,
          { long: true }
        )}`
      )
      .setTimestamp()
      .setFooter(
        `${clientUser.tag}`,
        clientUser.avatarURL() || clientUser.defaultAvatarURL
      )
  );
};

export const successfullyBannedEmbed = (
  interaction: CommandInteraction,
  server_id: string,
  portalChannel: TextChannel
): MessageEmbed => {
  const member = interaction.member as GuildMember;
  const clientUser = interaction.client.user as ClientUser;

  return (
    new MessageEmbed()
      //blue
      .setColor(0x0099ff)
      .setAuthor(
        `${member.user.tag}`,
        member.user.avatarURL() || member.user.defaultAvatarURL
      )
      .setTitle(`:hammer: Banned`)
      .setDescription(
        `:hammer: You have successfully banned \`${server_id}\` in ${portalChannel.toString()}`
      )
      .setTimestamp()
      .setFooter(
        `${clientUser.tag}`,
        clientUser.avatarURL() || clientUser.defaultAvatarURL
      )
  );
};

export const successfullyUnmutedEmbed = (
  interaction: CommandInteraction,
  server_id: string,
  portalChannel: TextChannel
): MessageEmbed => {
  const member = interaction.member as GuildMember;
  const clientUser = interaction.client.user as ClientUser;

  return (
    new MessageEmbed()
      //blue
      .setColor(0x0099ff)
      .setAuthor(
        `${member.user.tag}`,
        member.user.avatarURL() || member.user.defaultAvatarURL
      )
      .setTitle(`Muted`)
      .setDescription(
        `📩 You have successfully unmuted \`${server_id}\` in ${portalChannel.toString()}`
      )
      .setTimestamp()
      .setFooter(
        `${clientUser.tag}`,
        clientUser.avatarURL() || clientUser.defaultAvatarURL
      )
  );
};
