import {
  CategoryChannel,
  Client,
  CommandInteraction,
  Guild,
  GuildChannel,
  Message,
  MessageEmbed,
  Role,
  TextChannel,
  User,
} from "discord.js";
import { GUILD_NOT_FOUND } from "../utils/bot_error_message";

export class TWGuildManager {
  constructor(private interaction: CommandInteraction) {
    this.interaction = interaction;
  }

  public createCategory = async (name: string): Promise<CategoryChannel> => {
    const guild = this.interaction.guild!;
    const category = await guild.channels.create(name, {
      type: "GUILD_CATEGORY",
    });
    return category;
  };

  public createTextChannel = async (
    name: string,
    category?: CategoryChannel
  ): Promise<TextChannel> => {
    const guild = this.interaction.guild!;
    const channel = await guild.channels.create(name, {
      type: "GUILD_TEXT",
    });
    if (category) await channel.setParent(category.id);
    return channel;
  };

  public static getGuild = (client: Client, guildId: string): Guild => {
    const guild = client.guilds.cache.find((guild) => guild.id === guildId);
    if (!guild) throw new Error(GUILD_NOT_FOUND);
    return guild;
  };

  public static getTextChannel = (
    client: Client,
    channelId: string
  ): TextChannel => {
    const channel = client.channels.cache.find(
      (channel) => channel.id === channelId
    ) as TextChannel;
    if (!channel) throw new Error("Channel not  found.");
    return channel;
  };

  public static getMessage = async (
    client: Client,
    channelId: string,
    messageId: string
  ): Promise<Message> => {
    const message = await this.getTextChannel(client, channelId).messages.fetch(
      messageId
    );
    return message;
  };

  public static auditLogDeletedChannel = async (
    client: Client,
    channelId: string
  ): Promise<User> => {
    const channel = this.getTextChannel(client, channelId);
    const auditLog = await channel.guild.fetchAuditLogs({
      type: "CHANNEL_DELETE",
    });
    const entry = auditLog.entries.find(
      (entry) => (entry.target as GuildChannel).id === channel.id
    );
    if (!entry) throw new Error("No audit results found.");
    const executor = entry.executor as User;
    if (!executor) throw new Error("No executor found.");
    return executor;
  };

  public static setChannelPrivate = async (
    channel: TextChannel,
    whitelistedRoles?: (Role | undefined)[],
    member?: User
  ): Promise<void> => {
    const overwrites = channel.permissionOverwrites;
    await overwrites.create(channel.guild.roles.everyone, {
      VIEW_CHANNEL: false,
    });

    if (whitelistedRoles) {
      whitelistedRoles.forEach((role) => {
        if (!role) return;
        overwrites.create(role, {
          VIEW_CHANNEL: true,
          SEND_MESSAGES: true,
        });
      });
    }

    if (member) {
      overwrites.create(member, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
      });
    }
  };

  public static sendEmbed = async (
    channel: TextChannel,
    embed: MessageEmbed
  ): Promise<Message> => {
    const message = await channel.send({
      embeds: [embed],
    });
    return message;
  };

  public replyWithEmbed = async (embed: MessageEmbed): Promise<void> => {
    await this.interaction.reply({
      embeds: [embed],
    });
  };
}
