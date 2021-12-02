import { Guild, Message, User, TextChannel, MessageEmbed } from "discord.js";
import { Blacklist } from "../db/blacklistClient";
import { Server } from "../db/serversClient";
import { Portal } from "../db/portalClient";
import { extractUrlFromMessage } from "../utils/bot_utils";

const messageCooldown = 5000; //5 seconds in ms
const createdAtCooldown = 86400000; //24h
const joinedAtCooldown = 14400000; //4h
const talkedRecently = new Set();

const messageTimeout = (message: Message): boolean => {
  if (talkedRecently.has(message.author.id)) {
    return false;
  }
  talkedRecently.add(message.author.id);
  setTimeout(() => {
    talkedRecently.delete(message.author.id);
  }, messageCooldown);
  return true;
};

const messageBlacklist = async (message: Message): Promise<boolean> => {
  const blacklistedServers = (await Blacklist.servers()) || [];
  const blacklistedUsers = (await Blacklist.users()) || [];
  const guildId = message.guildId as string;

  return (
    !blacklistedServers.includes(guildId) &&
    !blacklistedUsers.includes(message.author.id)
  );
};

const isBlacklistedFromServer = async (
  message: Message,
  guild: Guild
): Promise<boolean> => {
  const server = await Server.findOne({ serverId: guild.id });
  if (!server) return false;
  const bannedUsers = server.bannedUsers || [];
  const bannedServers = server.bannedServers || [];
  return (
    bannedUsers.includes(message.author.id) ||
    bannedServers.includes(message.guildId as string)
  );
};

const messageNewAccount = (message: Message): boolean => {
  return Date.now() - message.author.createdTimestamp > createdAtCooldown;
};

const messageNewJoined = (message: Message): boolean => {
  const memberJoined = message.member?.joinedTimestamp as number;
  return ((Date.now() - memberJoined) as number) > joinedAtCooldown;
};

export const allowMessage = async (message: Message): Promise<boolean> => {
  const isNotBlacklisted = await messageBlacklist(message);
  const isNotNewAccount = messageNewAccount(message);
  const isNotNewJoined = messageNewJoined(message);
  const isNotTimeout = messageTimeout(message);
  return isNotBlacklisted && isNotNewAccount && isNotNewJoined && isNotTimeout;
};

export const isBannedFromGuild = (user: User, guild: Guild): boolean => {
  const bannedUsers = guild.bans.cache.map((ban) => ban.user.id) || [];
  return bannedUsers.includes(user.id);
};

export const filterMessage = async (
  message: Message,
  channel: TextChannel
): Promise<boolean> => {
  const blacklistedFromServer = await isBlacklistedFromServer(
    message,
    channel.guild as Guild
  );
  return (
    isBannedFromGuild(message.author, channel.guild as Guild) ||
    blacklistedFromServer
  );
};

export const isBlacklistedFromPortal = async (
  message: Message,
  originChannelId: string
): Promise<boolean> => {
  const portal = await Portal.findOne({
    where: { originChannelId },
  });
  if (!portal) return false;
  if (
    portal.isMemberBlacklisted(message.member?.id as string) ||
    portal.isServerBlacklisted(message?.guildId as string) ||
    portal.isServerMuted(message?.guildId as string)
  ) {
    return true;
  }

  return false;
};

export const embedMediaHandler = (
  message: Message,
  embed: MessageEmbed
): MessageEmbed => {
  const image = message.attachments.first()?.url;

  const url = extractUrlFromMessage(message.cleanContent);
  const imageExtentions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

  if (image && imageExtentions.some((ext) => image.endsWith(ext))) {
    embed.setImage(image);
    return embed;
  }
  const urlIsImage =
    url &&
    url?.length > 0 &&
    imageExtentions.some((ext) => url[0].endsWith(ext));

  if (urlIsImage) {
    embed.setImage(url[0]);
    return embed;
  }
  return embed;
};
