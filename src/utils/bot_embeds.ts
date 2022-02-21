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
  EmbedAuthorData,
} from "discord.js";
import { PortalRequestEmojis } from "./decoration";
import { botCommands } from "../cmds";
import ms from "ms";
import { APP_URL, defaultAuthorData, defaultClientFooter } from "./constants";

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
    .setAuthor(defaultAuthorData(author))
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
    .setFooter(defaultClientFooter(clientUser));
};

export const commandHelpEmbed = (client: Client) => {
  return new MessageEmbed()
    .setColor(0x0099ff)

    .setAuthor({
      name: "TheWatcher Command Help",
      icon_url: client.user?.displayAvatarURL(),
      url: APP_URL,
    } as EmbedAuthorData)
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
        value: "`/ban` `/unban` `banlist` `/mute` `/unmute`\n",
      },
      {
        name: ":information_source: Information",
        value: "`/help` `/info` `/ping` `/serverinfo`\n",
      },
      // {
      //   name: ":tada: Fun",
      //   value: "`/8ball` `/coinflip` `/roll` `/choose`",
      // },
      {
        name: ":test_tube: Experimental",
        value: `\`/teleport\`\n\n\n\n**Need More Help?**\nVisit the bot's website [here](https://thewatcher.xyz) or Join the [Support Server](https://discord.gg/) for more help.\n\n**<@${client.user?.id}> is controlled by users with Manage Server permissions.**`,
      }
    )
    .setFooter(defaultClientFooter(client.user as ClientUser, true))
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
      .setAuthor(defaultAuthorData(member))

      .setColor(0xff555f)
      .setDescription(failedMessage)
      .setTimestamp()
      .setFooter(defaultClientFooter(client.user as ClientUser))
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
      .setFooter(defaultClientFooter(client.user as ClientUser))
  );
};

export const portalServerBannedMembersEmbed = (
  client: Client,
  bannedServers: string[],
  channelName: string
): MessageEmbed => {
  return new MessageEmbed()
    .setColor(0x0099ff)
    .setTitle(`:hammer: Portal Server Banned Members`)
    .setDescription(
      `**${bannedServers.length}** servers are currently banned from the portal.\n\n` +
        `\`${bannedServers.join("`\n`")}\``
    )
    .setFooter(
      `${client.user?.tag}`,
      client.user?.avatarURL() || client.user?.defaultAvatarURL
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
    .setAuthor({
      name: `Server Members in "${channelName}"`,
      icon_url: client.user?.displayAvatarURL(),
    } as EmbedAuthorData)

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
    .setFooter(defaultClientFooter(client.user as ClientUser, true));
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
    .setAuthor(defaultAuthorData(member))
    .setTitle(`Left Portal`)
    .setDescription(
      `📩 You have successfully left the portal in 
       **${channel.name}**\`${channel.id}\`\n`
    )
    .setTimestamp()
    .setThumbnail(guild.iconURL() as string)
    .setFooter(defaultClientFooter(clientUser));
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
    .setAuthor(defaultAuthorData(member))
    .setTitle(`:hammer: Banned`)
    .setDescription(
      `:hammer: You have been muted in ${portalChannel} by **${server.name}**\`${server.id}\`\n`
    )
    .setTimestamp()
    .setFooter(defaultClientFooter(clientUser));
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
      .setAuthor(defaultAuthorData(member))
      .setTitle(`Muted`)
      .setDescription(
        `📩 You have been muted in ${portalChannel} by **${server.name}**\`${
          server.id
        }\`\n
      **Duration:** ${ms(duration, { long: true })}`
      )
      .setTimestamp()
      .setFooter(
      defaultClientFooter(clientUser),
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
      .setAuthor(defaultAuthorData(member))
      .setTitle(`Unmuted`)
      .setDescription(
        `📩 You have been unmuted in ${portalChannel} by **${server.name}**\`${server.id}\`\n`
      )
      .setTimestamp()
      .setFooter(
      defaultClientFooter(clientUser),
      )
  );
};

export const unbannedServerEmbed = (
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
      .setAuthor(defaultAuthorData(member))
      .setTitle(`Unbanned`)
      .setDescription(
        `📩 You have been unbanned in ${portalChannel} by **${server.name}**\`${server.id}\`\n`
      )
      .setTimestamp()
      .setFooter(
       defaultClientFooter(clientUser),
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
      .setAuthor(defaultAuthorData(member))
      .setTitle(`Muted`)
      .setDescription(
        `📩 You have successfully muted \`${server_id}\` in ${portalChannel.toString()} for ${ms(
          duration,
          { long: true }
        )}`
      )
      .setTimestamp()
      .setFooter(
        defaultClientFooter(clientUser),
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
      .setAuthor(defaultAuthorData(member))
      .setTitle(`:hammer: Banned`)
      .setDescription(
        `:hammer: You have successfully banned \`${server_id}\` in ${portalChannel.toString()}`
      )
      .setTimestamp()
      .setFooter(
       defaultClientFooter(clientUser),
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
      .setAuthor(defaultAuthorData(member))
      .setTitle(`Muted`)
      .setDescription(
        `📩 You have successfully unmuted \`${server_id}\` in ${portalChannel.toString()}`
      )
      .setTimestamp()
      .setFooter(
       defaultClientFooter(clientUser),
      )
  );
};

export const successfullyUnbannedEmbed = (
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
      .setAuthor(defaultAuthorData(member))
      .setTitle(`Muted`)
      .setDescription(
        `📩 You have successfully unbanned \`${server_id}\` in ${portalChannel.toString()}`
      )
      .setTimestamp()
      .setFooter(
       defaultClientFooter(clientUser),
      )
  );
};
