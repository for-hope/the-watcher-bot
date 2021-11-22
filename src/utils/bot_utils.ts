import {
  Guild,
  CategoryChannel,

  TextChannel,
} from "discord.js";

//CONSTANTS

export const PORTALS_CATEGORY_NAME = "Portals";

export const isBotOnServer = (serverId: string, client: any): boolean => {
  return client.guilds.cache.find((guild) => guild.name === serverId);
};

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
  channel: TextChannel,
  guildId
): Promise<void> => {
  await channel.permissionOverwrites.edit(guildId, {
    USE_EXTERNAL_EMOJIS: false,
    USE_EXTERNAL_STICKERS: false,
    USE_PRIVATE_THREADS: false,
    USE_PUBLIC_THREADS: false,
    USE_APPLICATION_COMMANDS: false,
    SEND_TTS_MESSAGES: false,
  });
};
