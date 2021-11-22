// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed } = require("discord.js");
const { token } = require("./config.json");

// Create a new client instance
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Ready!");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "ping") {
    await interaction.reply("Pong!");
  } else if (commandName === "server") {
    await interaction.reply(
      `Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`
    );
  } else if (commandName === "multiverse") {
    if (interaction.guild.name === "Arcade Hangout") {
      client.channels.cache
        .get("759455488995360819")
        .send("Beep Boop from Arcade Hangouts");
      await interaction.reply("Done!");
    } else {
      client.channels.cache
        .get("856608591480881162")
        .send("Beep Boop from Chill Palace");
      await interaction.reply("Done!");
    }
  } else if (commandName === "setup") {
    const category = await interaction.guild.channels.create("Multiverse", {
      type: "GUILD_CATEGORY",
    });
    let channel = await interaction.guild.channels.create("Border-Control", {
      type: "GUILD_TEXT",
    });
    await channel.setParent(category.id);
    channel = await interaction.guild.channels.create("Gate #1", {
      type: "GUILD_TEXT",
    });
    await channel.setParent(category.id);
    channel = await interaction.guild.channels.create("Gate #2", {
      type: "GUILD_TEXT",
    });
    await channel.setParent(category.id);
    channel = await interaction.guild.channels.create("Gate #3", {
      type: "GUILD_TEXT",
    });
    await channel.setParent(category.id);
    await interaction.reply("Done!");
  } else if (commandName === "connect") {
    await interaction.reply("Connecting...");
    await client.channels.cache
      .get("856608591480881162")
      .send("Beep Boop from Chill Palace");
    await interaction.reply("Done!");
  }
});

const extractUrlFromMessage = (message) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const url = message.match(urlRegex);
  return url;
};

const getMessageEmbed = (messageObject) => {
  const message = messageObject.content.replaceAll("@every", "@ every");

  const author = messageObject.author;
  const guild = messageObject.guild;
  const image =
    messageObject.attachments.size > 0
      ? messageObject.attachments.first().url
      : "";
  const embed = new MessageEmbed()

    .setDescription(message)
    .setColor("#0099ff")
    .setURL("https://discord.gg/")
    .setAuthor(
      `${author.username}#${author.discriminator}`,
      author.avatarURL(),
      "https://discord.gg/" + guild.id
    )
    .setFooter(`${guild.name} • ${guild.id} • ${author.id}`, guild.iconURL());

  const url = extractUrlFromMessage(message);

  if (
    (image && image.endsWith(".jpg")) ||
    image.endsWith(".png") ||
    image.endsWith(".gif") ||
    image.endsWith(".jpeg")
  ) {
    embed.setImage(image);
  } else if (url) {
    // embed.setThumbnail(url[0]);
    embed.setImage(url[0]);
    //set description message without url[0]
    embed.setDescription(message.replace(url[0], ""));
  }

  return embed;
};

//client on message on channel Grate #1
client.on("messageCreate", async (message) => {
  if (message.channel.name === "gate-1" && message.author.bot === false) {
    message.delete();
    const channels = client.channels.cache.filter(
      (channel) => channel.name === "gate-1"
    );

    channels.forEach(async (channel) => {
      await channel.send({
        embeds: [getMessageEmbed(message)],
      });
    });
  } else if (
    message.channel.name === "gate-2" &&
    message.author.bot === false
  ) {
    message.delete();
    const channels = client.channels.cache.filter(
      (channel) => channel.name === "gate-2"
    );

    channels.forEach(async (channel) => {
      await channel.send({
        embeds: [getMessageEmbed(message)],
      });
    });
  } else if (
    message.channel.name === "gate-3" &&
    message.author.bot === false
  ) {
    message.delete();
    const channels = client.channels.cache.filter(
      (channel) => channel.name === "gate-3"
    );

    channels.forEach(async (channel) => {
      await channel.send({
        embeds: [getMessageEmbed(message)],
      });
    });
  }
});
// Login to Discord with your client's token
client.login(token);
