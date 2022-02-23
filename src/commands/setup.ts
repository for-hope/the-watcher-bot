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
import { setupSlashCommand } from "../command-data/setup";
import { botCommands } from "../cmds";
import { SetupResponse } from "../responses/setup-response";
module.exports = {
  data: setupSlashCommand(),
  async execute(interaction: CommandInteraction) {
    //check if the user has the require role or manage server permission

    //1 - check permissions
    //2 - validate request
    //3 - process request
    //4 - send result as a reply
    const setupResponse = new SetupResponse(interaction);
    if (!(await setupResponse.validate())) {
      return;
    }
    console.log("valid setup request");
    setupResponse.process();
  },
};
