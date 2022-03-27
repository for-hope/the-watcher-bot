import { ExtendSlashCommandBuilder } from "./slash";

export enum SlashCommandOptions {
  BOOLEAN = "boolean",
  CHANNEL = "channel",
  USER = "user",
  ROLE = "role",
  STRING = "string",
  MENTIONABLE = "mentionable",
  INTEGER = "integer",
  NUMBER = "number",
}
export interface ICommandArgs {
  name: string;
  description: string;
  longDescription?: string;
  type: SlashCommandOptions;
  required?: boolean;
}

export interface IBotCommand {
  name: string;
  usage: string;
  description: string;
  longDescription: string;
  aliases: string[];
  args: {
    [key: string]: ICommandArgs;
  };
}

const connectCmd: IBotCommand = {
  name: "connect",
  usage: "connect <server_id> <channel>",
  aliases: ["connect"],
  description:
    "Connect and chat with a server or multiple servers in a portal channel!.",
  longDescription:
    "Connect to a server or multiple servers in a private portal channel!.\n\n" +
    "A connection request will be sent to the server you want to connect to.\n" +
    "If the other server accepts the request, you can commmunicate on the channel you specified .\n",
  args: {
    server_id: {
      name: "server_id",
      description: "The ID of the server you want to connect to.",
      type: SlashCommandOptions.STRING,
      required: true,
    },
    channel: {
      name: "channel",
      description: "The channel you want to open the chat portal on.",
      type: SlashCommandOptions.CHANNEL,
      required: true,
    },
  },
};

const setupCmd: IBotCommand = {
  name: "setup",
  usage: "setup [traffic_channel] [role] [multiverse_chat]",
  aliases: ["setup"],
  description: "Setup the bot for interserver communications.",
  longDescription:
    "This command is needed to correctly setup the bot to recieve connection requests from other servers, it will create a traffic channel in a new category, you can move the channel and rename it but do not remove it!",
  args: {
    traffic_channel: {
      name: "traffic_channel",
      description:
        "The channel you want to use for receiving and sending connection requests.",
      type: SlashCommandOptions.CHANNEL,
      required: false,
    },
    role: {
      name: "role",
      description:
        "The role that can manage this bot and can send or accept connection requests from other servers.",
      type: SlashCommandOptions.ROLE,
      required: false,
    },
    multiverse_chat: {
      name: "multiverse_chat",
      description:
        "This channel is a global general chat between all the servers that have this feature enabled.",
      type: SlashCommandOptions.BOOLEAN,
      required: false,
    },
  },
};

const membersCmd: IBotCommand = {
  name: "members",
  usage: "members [channel]",
  aliases: ["members"],
  description: "List all the members in a channel.",
  longDescription:
    "This command will list all the members in a channel.\n\n" +
    "If you specify a channel, it will list all the members in that channel.\n" +
    "If you don't specify a channel, it will list all the members in the current channel.",
  args: {
    channel: {
      name: "channel",
      description: "The channel you want to list the members of.",
      type: SlashCommandOptions.CHANNEL,
      required: false,
    },
  },
};

const leaveCmd: IBotCommand = {
  name: "leave",
  usage: "leave",
  aliases: ["leave"],
  description: "Leave the current portal.",
  longDescription:
    "This command will leave the current portal in a specific channel.\n\n" +
    "You can use this command in a portal channel to leave the  portal.\n",
  args: {
    channel: {
      name: "channel",
      description:
        "The channel you want to leave the portal in. if empty it will leave the current channel.",
      type: SlashCommandOptions.CHANNEL,
      required: false,
    },
  },
};

const banCmd: IBotCommand = {
  name: "ban",
  usage: "ban <serverId> [channel] [reason]",
  aliases: ["ban"],
  description: "Ban a server from the current portal.",
  longDescription:
    "This command will ban a server from the current portal.\n\n" +
    "You can use this command in a portal channel to ban a server.\n",
  args: {
    serverId: {
      name: "server",
      description: "The server you want to ban.",
      type: SlashCommandOptions.STRING,
      required: true,
    },
    channel: {
      name: "channel",
      description: "The portal channel you want to ban the server from.",
      type: SlashCommandOptions.CHANNEL,
      required: false,
    },
    reason: {
      name: "reason",
      description: "The reason you want to give for banning the server.",
      type: SlashCommandOptions.STRING,
      required: false,
    },
  },
};

const banListCmd: IBotCommand = {
  name: "banlist",
  usage: "banlist",
  aliases: ["banlist"],
  description: "List all the banned servers from the current portal.",
  longDescription:
    "This command will list all the banned servers from the current portal.\n\n" +
    "You can use this command in a portal channel to list all the banned servers.\n",
  args: {
    channel: {
      name: "channel",
      description:
        "The portal channel you want to list the banned servers from.",
      type: SlashCommandOptions.CHANNEL,
      required: false,
    },
  },
};

const muteCmd: IBotCommand = {
  name: "mute",
  usage: "mute <serverId> [channel] [duration] [reason]",
  aliases: ["mute"],
  description: "Mute a server from the current portal.",
  longDescription:
    "This command will mute a server from the current portal.\n\n" +
    "You can use this command in a portal channel to mute a server.\n",
  args: {
    serverId: {
      name: "server",
      description: "The server you want to mute.",
      type: SlashCommandOptions.STRING,
      required: true,
    },
    channel: {
      name: "channel",
      description: "The portal channel you want to mute the server from.",
      type: SlashCommandOptions.CHANNEL,
      required: false,
    },
    duration: {
      name: "duration",
      description: "The duration of the mute. Ex 1h, 1d, 1w...",
      type: SlashCommandOptions.STRING,
      required: false,
    },
    reason: {
      name: "reason",
      description: "The reason you want to give for muting the server.",
      type: SlashCommandOptions.STRING,
      required: false,
    },
  },
};

export const botCommands = {
  connect: connectCmd,
  setup: setupCmd,
  members: membersCmd,
  leave: leaveCmd,
  ban: banCmd,
  banList: banListCmd,
  mute: muteCmd,
};

export const slashCommand = (cmd: IBotCommand): ExtendSlashCommandBuilder => {
  const command = new ExtendSlashCommandBuilder()
    .setName(cmd.name)
    .setDescription(cmd.description);
  command.addArgs(cmd.args);
  return command;
};
