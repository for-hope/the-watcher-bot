import {
  Guild,
  CategoryChannel,
  TextChannel,
  Client,
  GuildChannel,
  User,
  Message,
} from "discord.js";
import { GUILD_NOT_FOUND } from "./bot_error_message";

//CONSTANTS

export const PORTALS_CATEGORY_NAME = "Portals";

export const getOrCreateBotCategory = async (
  guild: Guild,
  categoryName: string
): Promise<{ created: boolean; category: CategoryChannel }> => {
  let created = false;
  let category = guild.channels.cache.find(
    (channel) =>
      (channel.name as string).toLowerCase() === categoryName.toLowerCase() &&
      channel.type === "GUILD_CATEGORY"
  ) as CategoryChannel;
  //if multiverse category does not exist, create it
  if (!category) {
    category = (await guild.channels.create(categoryName, {
      type: "GUILD_CATEGORY",
    })) as CategoryChannel;
    created = true;
  }

  return { created, category };
};

export const overwritePortalPermissions = async (
  channel: TextChannel
): Promise<void> => {
  await channel.permissionOverwrites.create(channel.guild.roles.everyone, {
    VIEW_CHANNEL: false,
    SEND_MESSAGES: false,
    READ_MESSAGE_HISTORY: false,
    USE_EXTERNAL_EMOJIS: false,
    USE_EXTERNAL_STICKERS: false,
    USE_PRIVATE_THREADS: false,
    USE_PUBLIC_THREADS: false,
    SEND_TTS_MESSAGES: false,
  });
};

export const getGuild = (client: Client, guildId: string): Guild | undefined => {
  const guild = client.guilds.cache.find((guild) => guild.id === guildId);
  return guild;
};

export const getTextChannel = (
  client: Client,
  channelId: string
): TextChannel | null => {
  const channel = client.channels.cache.find(
    (channel) => channel.id === channelId
  ) as TextChannel;
  return channel;
};

export const getMessage = async (
  client: Client,
  messageId: string,
  channelId: string
): Promise<Message | undefined> => {
  const message = await getTextChannel(client, channelId)?.messages.fetch(
    messageId
  );

  return message;
};

export const deletedChannelAuthor = async (channel: TextChannel) => {
  const logs = await channel.guild.fetchAuditLogs({ type: "CHANNEL_DELETE" });
  return logs.entries.find(
    (entry) => (entry.target as GuildChannel).id === channel.id
  )?.executor as User | undefined;
};

export const extractUrlFromMessage = (message: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const url = message.match(urlRegex);
  return url;
};
