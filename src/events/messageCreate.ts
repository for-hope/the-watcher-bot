import { Client, Message, MessageEmbed, TextChannel, Guild } from "discord.js";
import { randomColor } from "../utils/decoration";
import { channelDimension, dimensionChannels } from "../db/dimensionClient";
import {
  getOriginChannelId,
  getChannelIdsOnPortal,
  Portal,
} from "../db/portalClient";
import {
  allowMessage,
  filterMessage,
  isBlacklistedFromPortal,
} from "../services/messageServices";

module.exports = {
  name: "messageCreate",
  execute(message: Message) {
    if (message.author.bot) return;

    //check if channel id is in a dimension
    channelDimension(message.channel.id).then(async (dimensionName) => {
      if (dimensionName) {
        const ids = await dimensionChannels(dimensionName);
        await forwardMessageIfIncluded(ids, message);
      }
    });

    getOriginChannelId(message.channel.id).then(
      async (originChannelId: string) => {
        if (!originChannelId) return;
        const ids = await getChannelIdsOnPortal(originChannelId);
        const blacklisted = await isBlacklistedFromPortal(
          message,
          originChannelId
        );
        if (blacklisted) return;

        await forwardMessageIfIncluded(ids, message);
      }
    );
  },
};

const forwardMessageIfIncluded = async (ids: string[], message: Message) => {
  const client = message.client as Client;
  if (!ids.includes(message.channel.id)) return;
  message.delete();
  const messageAllowed = await allowMessage(message);
  if (!messageAllowed) {
    console.log("message not allowed");
    return;
  } //message is not allowed
  //channels in the portal
  const channels = client.channels.cache.filter((channel) => {
    return ids.includes(channel.id);
  });

  channels.forEach(async (channel) => {
    if (await filterMessage(message, channel as TextChannel)) {
      console.log("message filtered");
      return;
    }
    await (channel as TextChannel).send({
      embeds: [getMessageEmbed(message)],
    });
  });
};
const extractUrlFromMessage = (message: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const url = message.match(urlRegex);
  return url;
};

const getMessageEmbed = (messageObject: Message) => {
  const message = messageObject.cleanContent;

  const author = messageObject.author;
  const guild = messageObject.guild as Guild;
  const rndColor = randomColor;
  const image =
    messageObject.attachments.size > 0
      ? messageObject.attachments.first()?.url
      : "";
  const embed = new MessageEmbed()
    .setAuthor(`${author.tag}`, author.avatarURL() || author.defaultAvatarURL)
    .setDescription(message)
    .setColor(`#${rndColor()}`)
    .setTitle(`||\`${author.id}\`||`)

    .setFooter(`${guild.name} • ID: ${guild.id}`, guild.iconURL() || "");

  const url = extractUrlFromMessage(message);

  if (image) {
    if (
      image.endsWith(".jpg") ||
      image.endsWith(".png") ||
      image.endsWith(".gif") ||
      image.endsWith(".jpeg")
    ) {
      embed.setImage(image);
    } else if (url) {
      // embed.setThumbnail(url[0]);
      // embed.setImage(url[0]);
      //set description message without url[0]
      embed.setDescription(message.replace(url[0], ""));
    }
  }

  return embed;
};
