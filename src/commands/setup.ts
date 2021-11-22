import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types/payloads/v9";
import {
  CommandInteraction,
  GuildMember,
  GuildTextBasedChannel,
  Permissions,
  Role,
} from "discord.js";
import { setupServer } from "../db/serversClient";
import { hasManagerPermission } from "../utils/permissions";
import {
  getOrCreateBotCategory,
  overwritePortalPermissions,
} from "../utils/bot_utils";
module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the server for interserver communications.")
    .addChannelOption((option) =>
      option
        .setName("traffic-channel")
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
        .setName("multiverse-chat")
        .setDescription(
          "Creates a general portal channel to all other servers within the bot's reach."
        )
        .setRequired(false)
    ),
  async execute(interaction: CommandInteraction) {
    //check if the user has the require role or manage server permission

    const hasPerms = await hasManagerPermission(interaction);
    if (!hasPerms) return;

    let trafficChannel = interaction.options.getChannel(
      "traffic-channel"
    ) as GuildTextBasedChannel;

    const adminRole = interaction.options.getRole("role") as Role;
    const multiverseChat: boolean =
      interaction.options.getBoolean("multiverse-chat");

    const multiverseChatChannel = multiverseChat
      ? await interaction.guild.channels.create("Multiverse Chat", {
          type: "GUILD_TEXT",
        })
      : null;
    if (!trafficChannel) {
      const category = (
        await getOrCreateBotCategory(interaction.guild, "multiverse")
      ).category;

      trafficChannel = await interaction.guild.channels.create("trafficWORKED", {
        type: "GUILD_TEXT",
      });
      await trafficChannel.setParent(category.id);

      if (adminRole) {
        await trafficChannel.permissionOverwrites.create(adminRole, {
          VIEW_CHANNEL: true,
          SEND_MESSAGES: true,
          READ_MESSAGE_HISTORY: true,
        });

        await trafficChannel.permissionOverwrites.create(interaction.guild.id, {
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

    await setupServer(
      interaction.guild.id,
      trafficChannel.id,
      multiverseChatChannel ? multiverseChatChannel.id : null,
      adminRole ? [adminRole.id] : [],
      false
    );

    //send setup is done on the traffic channel
    await interaction.reply(
      `:white_check_mark:  Setup is complete! You can now use the \`!connect\` command to connect to other servers. You can also recieve portal connection requests on ${trafficChannel.toString()}`
    );
  },
};
