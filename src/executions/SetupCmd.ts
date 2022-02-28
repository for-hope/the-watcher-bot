import {
  CommandInteraction,
  GuildMember,
  Permissions,
  Role,
  TextChannel,
  User,
} from "discord.js";
import { botCommands } from "../cmds";
import { IServerSetup, Server } from "../db/serversClient";
import { TWGuildManager } from "../managers/guild-manager";
import { infoMessageEmbed } from "../utils/bot_embeds";
import { BOT_SETUP_REPLY, TRAFFIC_CHANNEL_SETUP } from "../utils/bot_messages";
import { BOT_CATEGORY_NAME, DASHBOARD_CHANNEL_NAME } from "../utils/constants";
import { IValidationPerms, Validator } from "../validators/Validator";
import TwCmd, { ICmdStatic } from "./TWCmd";

export const SetupCommand: ICmdStatic = class SetupCommand extends TwCmd {
  public static COMMAND = botCommands.setup;
  public DEFAULT_ERROR_MESSAGE =
    "There was an error setting up the server. Please try again later.";
  validationPerms: IValidationPerms = {
    botPermFlags: [
      Permissions.FLAGS.SEND_MESSAGES,
      Permissions.FLAGS.EMBED_LINKS,
      Permissions.FLAGS.MANAGE_CHANNELS,
      Permissions.FLAGS.MANAGE_MESSAGES,
    ],
    userPermFlags: [Permissions.FLAGS.MANAGE_GUILD],
    customPermFlags: [Validator.FLAGS.IS_SERVER_SETUP],
  };
  private dashboardChannel: TextChannel | undefined;
  private adminRole: Role | undefined;

  args = (): void => {
    const args = SetupCommand.COMMAND.args;
    const interactionOptions = this.interaction.options;
    this.dashboardChannel = interactionOptions.getChannel(
      args.traffic_channel.name
    ) as TextChannel | undefined;
    this.adminRole = interactionOptions.getRole(args.role.name) as
      | Role
      | undefined;
  };
  constructor(interaction: CommandInteraction) {
    super(interaction);
    this.args();
  }

  public successReply = async () => {
    if (!this.dashboardChannel) return;
    await TWGuildManager.sendEmbed(
      this.dashboardChannel,
      infoMessageEmbed(
        this.interaction.client,
        this.interaction.user!,
        TRAFFIC_CHANNEL_SETUP(
          this.interaction.member as GuildMember,
          this.adminRole
        )
      )
    );
    await this.guildManager.replyWithEmbed(
      infoMessageEmbed(
        this.interaction.client,
        this.interaction.user!,
        BOT_SETUP_REPLY(this.dashboardChannel)
      )
    );
  };

  public execute = async (): Promise<boolean> => {
    const guild = this.interaction.guild!;
    const user = this.interaction.user! as User;
    if (!this.dashboardChannel) {
      const category = await this.guildManager.createCategory(
        BOT_CATEGORY_NAME
      );
      this.dashboardChannel = await this.guildManager.createTextChannel(
        DASHBOARD_CHANNEL_NAME,
        category
      );
    }
    TWGuildManager.setChannelPrivate(
      this.dashboardChannel,
      [this.adminRole],
      user
    );
    const server = await Server.new(guild);
    const serverSetup: IServerSetup = {
      channelId: this.dashboardChannel.id,
      adminRoleIds: this.adminRole ? [this.adminRole.id] : [],
    };
    const updatedServer = await server.setup(serverSetup);
    if (updatedServer.isSetup) await this.successReply();
    return true;
  };
};
