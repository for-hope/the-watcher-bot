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
        value:
        `\`/teleport\`\n\n\n\n**Need More Help?**\nVisit the bot's website [here](https://thewatcher.xyz) or Join the [Support Server](https://discord.gg/) for more help.\n\n**<@${client.user?.id}> is controlled by users with Manage Server permissions.**`,
      }
    )
    .setFooter("thewatcher.xyz", client.user?.avatarURL() || "")
    .setTimestamp();
};
