import {
  ClientUser,
  EmbedAuthorData,
  EmbedFooterData,
  GuildMember,
  User,
} from "discord.js";

export const APP_URL = "https://thewatcher.xyz";
export const DASHBOARD_CHANNEL_NAME = "dashboard";
export const BOT_CATEGORY_NAME = "the-watcher";

export const defaultAuthorData = (author: GuildMember | User, url?: string) => {
  const tag = author instanceof GuildMember ? author.user.tag : author.tag;
  const iconUrl =
    author instanceof GuildMember
      ? author.user.displayAvatarURL()
      : author.displayAvatarURL();

  const data: EmbedAuthorData = {
    name: tag,
    iconURL: iconUrl,
  };
  return data;
};

export const defaultClientFooter = (client: ClientUser, website?: boolean) => {
  const text = website ? `${APP_URL}` : `${client.tag}`;
  return {
    text: text,
    iconURL: client.displayAvatarURL(),
  } as EmbedFooterData;
};
