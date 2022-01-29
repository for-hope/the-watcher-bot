import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types/payloads/v9";
import {
  CommandInteraction,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  Role,
  User,
} from "discord.js";
import { setupServer } from "../db/serversClient";
import { hasManagerPermission } from "../utils/permissions";
import { BOT_SETUP_REPLY, TRAFFIC_CHANNEL_SETUP } from "../utils/bot_messages";
import {
  getOrCreateBotCategory,
  overwritePortalPermissions,
} from "../utils/bot_utils";
import { infoMessageEmbed } from "../utils/bot_embeds";
module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the server for interserver communications.")
    .addChannelOption((option) =>
      option
        .setName("traffic_channel")
        .addChannelType(ChannelType.GuildText)
        .setDescription(
          "Specify the text channel on which you recieve or send portal connection requests from other servers."
        )
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription(
          "Specify the role that can manage this bot and view the traffic channel."
        )
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("multiverse_chat")
        .setDescription(
          "Creates a general portal channel to all other servers within the bot's reach."
        )

        .setRequired(false)
    ),
  async execute(interaction: CommandInteraction) {
    //check if the user has the require role or manage server permission

    const hasPerms = await hasManagerPermission(interaction);
    if (!hasPerms) return;

    const guild = interaction.guild as Guild;
    let trafficChannel = interaction.options.getChannel(
      "traffic-channel"
    ) as GuildTextBasedChannel;

    const adminRole = interaction.options.getRole("role") as Role | undefined;
    const multiverseChat: boolean =
      interaction.options.getBoolean("multiverse-chat") || true;

    const multiverseChatChannel = multiverseChat
      ? await guild.channels.create("Multiverse Chat", {
          type: "GUILD_TEXT",
        })
      : null;
    if (!trafficChannel) {
      const category = (await getOrCreateBotCategory(guild, "multiverse"))
        .category;

      trafficChannel = await guild.channels.create("traffic", {
        type: "GUILD_TEXT",
      });
      await trafficChannel.setParent(category.id);

      if (adminRole) {
        await trafficChannel.permissionOverwrites.create(adminRole, {
          VIEW_CHANNEL: true,
          SEND_MESSAGES: true,
          READ_MESSAGE_HISTORY: true,
        });

        await trafficChannel.permissionOverwrites.create(guild.id, {
          VIEW_CHANNEL: false,
          SEND_MESSAGES: false,
          READ_MESSAGE_HISTORY: false,
        });
      }
      await overwritePortalPermissions(trafficChannel);
    }

    if (multiverseChatChannel) {
      await multiverseChatChannel.setParent(trafficChannel.parentId);
    }

    //send a message to the traffic channel
    await trafficChannel.send({
      embeds: [
        infoMessageEmbed(
          interaction.client,
          interaction.member.user as User,
          TRAFFIC_CHANNEL_SETUP(interaction.member as GuildMember, adminRole)
        ),
      ],
    });

    await setupServer(
      guild.id,
      trafficChannel.id,
      multiverseChatChannel ? multiverseChatChannel.id : undefined,
      adminRole ? [adminRole.id] : [],
      false
    );

    await interaction.reply({
      embeds: [
        infoMessageEmbed(
          interaction.client,
          interaction.member.user as User,
          BOT_SETUP_REPLY(trafficChannel)
        ),
      ],
    });
  },
};
