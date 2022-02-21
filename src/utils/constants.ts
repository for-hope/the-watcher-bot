import {
  ClientUser,
  EmbedAuthorData,
  EmbedFooterData,
  GuildMember,
  User,
} from "discord.js";

export const APP_URL = "https://thewatcher.xyz";

export const defaultAuthorData = (author: GuildMember | User, url?: string) => {
  const tag = author instanceof GuildMember ? author.user.tag : author.tag;
  const iconUrl =
    author instanceof GuildMember
      ? author.user.displayAvatarURL()
      : author.displayAvatarURL();
  return {
    name: tag,
    iconUrl: iconUrl,
  } as EmbedAuthorData;
};

export const defaultClientFooter = (client: ClientUser, website?: boolean) => {
  const text = website ? `${APP_URL}` : `${client.tag}`;
  return {
    text: text,
    icon_url: client.displayAvatarURL(),
  } as EmbedFooterData;
};
