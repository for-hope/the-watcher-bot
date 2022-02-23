import {
  CommandInteraction,
  GuildMember,
  GuildTextBasedChannel,
  Permissions,
  Role,
  TextChannel,
  User,
} from "discord.js";
import { botCommands } from "../cmds";
import { setupServer } from "../db/serversClient";
import { infoMessageEmbed } from "../utils/bot_embeds";
import { BOT_SETUP_REPLY, TRAFFIC_CHANNEL_SETUP } from "../utils/bot_messages";
import {
  getOrCreateBotCategory,
  overwritePortalPermissions,
} from "../utils/bot_utils";
import { hasManagerPermission } from "../utils/permissions";
import { IValidation, Validator } from "../validators/validators";

export class SetupResponse {
  private interaction: CommandInteraction;

  public botFlags = [
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.MANAGE_CHANNELS,
    Permissions.FLAGS.MANAGE_MESSAGES,
  ];
  public userPerms = [Permissions.FLAGS.MANAGE_GUILD];

  private validator: Validator;
  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
    this.validator = new Validator(interaction);
  }

  private invalidReply = async (message: string) => {
    await this.interaction.reply({
      content: message,
      ephemeral: true,
    });
  };

  public validate = async (): Promise<boolean> => {
    let isValid = true;
    const validations: IValidation[] = [
      await this.validator.userPermissions(this.userPerms),
      await this.validator.botPermissions(this.botFlags),
      {
        ...(await this.validator.serverSetup()),
        replyEvenIfValid: true,
      },
    ]; //todo tidy

    validations.forEach(async (validation) => {
      if (
        (!validation.replyEvenIfValid && !validation.isValid) ||
        (validation.isValid && validation.replyEvenIfValid)
      ) {
        this.invalidReply(validation.message);
        isValid = false;
        return false;
      }
    });
    return isValid;
  };

  private args = (): {
    trafficChannel: TextChannel | undefined;
    adminRole: Role | undefined;
  } => {
    const args = botCommands.setup.args;
    const interactionOptions = this.interaction.options;
    const trafficChannel = interactionOptions.getChannel(
      args.traffic_channel.name
    ) as TextChannel | undefined;
    const adminRole = interactionOptions.getRole(args.role.name) as
      | Role
      | undefined;
    return {
      trafficChannel,
      adminRole,
    };
  };

  public process = async (): Promise<void> => {
    // args

    const { adminRole } = this.args();
    let { trafficChannel } = this.args();

    const guild = this.interaction.guild!;

    if (!trafficChannel) {
      const category = (await getOrCreateBotCategory(guild, "the-watcher"))
        .category;

      trafficChannel = await guild.channels.create("traffic", {
        type: "GUILD_TEXT",
      });
      await trafficChannel.setParent(category.id);
    }

    if (adminRole) {
      await trafficChannel.permissionOverwrites.create(adminRole, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
        READ_MESSAGE_HISTORY: true,
      });
    }
    await overwritePortalPermissions(trafficChannel);

    await trafficChannel.send({
      embeds: [
        infoMessageEmbed(
          this.interaction.client,
          this.interaction?.member?.user as User,
          TRAFFIC_CHANNEL_SETUP(
            this.interaction.member as GuildMember,
            adminRole
          )
        ),
      ],
    });
    await setupServer(
      guild.id,
      trafficChannel.id,
      undefined,
      adminRole ? [adminRole.id] : [],
      false
    );

    await this.interaction.reply({
      embeds: [
        infoMessageEmbed(
          this.interaction.client,
          this.interaction?.member?.user as User,
          BOT_SETUP_REPLY(trafficChannel)
        ),
      ],
    });
  };
}
