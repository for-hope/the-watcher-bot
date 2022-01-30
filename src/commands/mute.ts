import { CommandInteraction, Guild, TextChannel } from "discord.js";

import { SlashCommandBuilder } from "@discordjs/builders";
import { portalByServersChannelId } from "../db/portalClient";
import { mutedServerEmbed, successfullyMutedEmbed } from "../utils/bot_embeds";
import { getTrafficChannel } from "../db/serversClient";
import { hasManagerPermission } from "../utils/permissions";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("mutes a servrer from a portal")
    .addStringOption((option) =>
      option
        .setName("server_id")
        .setDescription(
          "The id of the server you want to mute from your portal"
        )
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription(
          "The duration in minutes you want to mute the server for"
        )
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Portal channel to mute the server on")
        .setRequired(false)
    ),

  async execute(interaction: CommandInteraction) {
    const channel = (interaction.options.getChannel("channel") ||
      interaction.channel) as TextChannel;
    const server_id = interaction.options.getString("server_id") as string;
    const duration = interaction.options.getInteger("duration") as number;
    const durationInMs = duration * 60 * 1000;
    if (!hasManagerPermission(interaction)) return
    //check if channel is a portal
    const portal = await portalByServersChannelId(channel.id);
    if (!portal) {
      interaction.reply("You must be in a portal channel to use this command!");
      return;
    }
    

    if (!portal.servers.map((server) => server.server_id).includes(server_id)) {
      interaction.reply(
        "The target server that you're trying to mute is not in this portal!"
      );
      return;
    }
    if (interaction.guild?.id !== portal.originServerId) {
        interaction.reply(
            ":x: You can't mute a server from a portal that isn't the origin server!"
        );
        return;
    }
    if (portal.originServerId === server_id) {
        interaction.reply(
            ":x: You can't mute the origin server from a portal!"
        );
        return;
    }

    
    await portal.muteServer(server_id, durationInMs);
    const serverOnPortal = interaction.client.guilds.cache.get(server_id);
    if (!serverOnPortal) {
        interaction.reply(
            "Mutting the server failed because the bot is not in the target server"
        );
        return; 
    }
    const trafficChannel = await getTrafficChannel(serverOnPortal);

    trafficChannel.send(
        {embeds: [mutedServerEmbed(interaction, duration, interaction.guild as Guild, channel.name)]}
    );


    await interaction.reply({
      embeds: [
        successfullyMutedEmbed(interaction, duration, server_id, channel),
      ],
    });


  },
};
