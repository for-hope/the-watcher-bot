import { newServer } from "../db/serversClient";
import { BaseGuildTextChannel, Guild, GuildMember, User } from "discord.js";
import { infoMessageEmbed } from "../utils/bot_embeds";
import { WELCOME_MESSAGE } from "../utils/bot_messages";

const dmOwnerOrServer = async (guild: Guild) => {
  const owner = await guild.fetchOwner();
  const msg = WELCOME_MESSAGE;
  if (owner) {
    const dmChannel = await owner.createDM();
    await dmChannel.send(msg).catch(async () => {
      console.log(`Failed to send DM to owner of guild : ${guild.id}`);
      //send the message on a bot channel
      const botChannel = guild.channels.cache.find(
        (c) =>
          c.name.includes("bot") &&
          c.type === "GUILD_TEXT" &&
          c.permissionsFor(guild.me as GuildMember).has("SEND_MESSAGES")
      ) as BaseGuildTextChannel;
      if (botChannel) {
        await botChannel.send({
          embeds: [
            infoMessageEmbed(guild.client, guild.client.user as User, msg),
          ],
        });
      }
    });
  }
};
module.exports = {
  name: "guildCreate",
  async execute(guild: Guild) {
    console.log(`Bot joined server with id : ${guild.id}`);
    await newServer(guild);
    await dmOwnerOrServer(guild);
  },
};
