import { Message } from "discord.js";
import { Blacklist } from "../db/blacklistClient";

const messageCooldown = 1500; //2 seconds in ms
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
  const blacklistedServers = await Blacklist.servers();
  const blacklistedUsers = await Blacklist.users();
  const guildId = message.guildId as string;

  return (
    !blacklistedServers.includes(guildId) &&
    !blacklistedUsers.includes(message.author.id)
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