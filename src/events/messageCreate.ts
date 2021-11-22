import { ColorResolvable, MessageEmbed } from "discord.js";
import { model } from "mongoose";
import channelIds from "../db/channel.json";
import { randomColor } from "../utils/decoration";
import { channelDimension, dimensionChannels } from "../db/dimensionClient";
import { channelPortal, portalChannels } from "../db/portalClient";

module.exports = {
  name: "messageCreate",
  execute(message) {
    if (message.author.bot) {
      return;
    }

    const client = message.client;
    //check if message is in a valid BOT watched channel
    if (message.channel.name === "gate-1") {
      console.log("Interaction : " + JSON.stringify(message.reference));
      //delete user message
      message.delete();

      const channels = client.channels.cache.filter(
        (channel) => channel.name === "gate-1"
      );

      channels.forEach(async (channel) => {
        await channel.send({
          embeds: [getMessageEmbed(message)],
        });
      });
    }

    //check if channel id is in a dimension
    channelDimension(message.channel.id).then(async (dimensionName) => {
      if (dimensionName) {
        const ids = await dimensionChannels(dimensionName);
        forwardMessageIfIncluded(ids, message, client);
      }
    });

    channelPortal(message.channel.id).then(async (originChannelId: string) => {
      if (originChannelId) {
        const ids = await portalChannels(originChannelId);
        forwardMessageIfIncluded(ids, message, client);
      }
    });
  },
};

const forwardMessageIfIncluded = (ids, message, client) => {
  if (ids.includes(message.channel.id)) {
    console.log(`message is included ` + message.cleanContent);
    message.delete();
    const channels = client.channels.cache.filter((channel) => {
      return ids.includes(channel.id);
    });

    channels.forEach(async (channel) => {
      await channel.send({
        embeds: [getMessageEmbed(message)],
      });
    });
  }
};
const extractUrlFromMessage = (message) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const url = message.match(urlRegex);
  return url;
};

const getMessageEmbed = (messageObject) => {
  const message = messageObject.content.replaceAll("@every", "@ every");

  const author = messageObject.author;
  const guild = messageObject.guild;
  const rndColor = randomColor;
  const image =
    messageObject.attachments.size > 0
      ? messageObject.attachments.first().url
      : "";
  const embed = new MessageEmbed()

    .setDescription(message)
    .setColor(`#${rndColor()}`)
    .setTitle(`||\`${author.id}\`||`)
    .setAuthor(`${author.tag}`, author.avatarURL())
    .setFooter(`${guild.name} • ID: ${guild.id}`, guild.iconURL());

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
