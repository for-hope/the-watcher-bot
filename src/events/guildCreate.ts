import { newServer } from "../db/serversClient";
import { BaseGuildTextChannel, Guild } from "discord.js";

const dmOwnerOrServer = async (guild: Guild) => {
  const owner = await guild.fetchOwner();
  const msg =
    "Hello, I am the **The Watcher Bot**. I am here to help you setup your server for interserver communications.\n\n" +
    "To setup your server, use the command `!setup` in any channel.\n\n" +
    "You can also use `!help` to see all the commands available to you.";
  if (owner) {
    const dmChannel = await owner.createDM();
    await dmChannel.send(msg).catch(async () => {
      console.log(`Failed to send DM to owner of guild : ${guild.id}`);
      //send the message on a bot channel
      const botChannel = guild.channels.cache.find(
        (c) =>
          c.name.includes("bot") &&
          c.type === "GUILD_TEXT" &&
          c.permissionsFor(guild.me).has("SEND_MESSAGES")
      ) as BaseGuildTextChannel;
      if (botChannel) {
        await botChannel.send(msg);
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
