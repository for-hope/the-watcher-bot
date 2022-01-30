interface IBotCommand {
  name: string;
  usage: string;
  description: string;
  longDescription: string;
  aliases: string[];
  args: {
    name: string;
    description: string;
    type: string;
    required: boolean;
  }[];
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
  args: [
    {
      name: "server_id",
      description: "The ID of the server you want to connect to.",
      type: "string",
      required: true,
    },
    {
      name: "channel",
      description: "The channel you want to open the chat portal on.",
      type: "string",
      required: true,
    },
  ],
};

const setupCmd: IBotCommand = {
  name: "setup",
  usage: "setup [traffic_channel] [role] [multiverse_chat]",
  aliases: ["setup"],
  description: "Setup the bot for interserver communications.",
  longDescription:
    "This command is needed to correctly setup the bot to recieve connection requests from other servers, it will create a traffic channel in a new category, you can move the channel and rename it but do not remove it!",
  args: [
    {
      name: "traffic_channel",
      description:
        "The channel you want to use for receiving and sending connection requests.",
      type: "string",
      required: false,
    },
    {
      name: "role",
      description:
        "The role that can manage this bot and can send or accept connection requests from other servers.",
      type: "string",
      required: false,
    },
    {
      name: "multiverse_chat",
      description:
        "This channel is a global general chat between all the servers that have this feature enabled. [experimental]",
      type: "boolean",
      required: false,
    },
  ],
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
  args: [
    {
      name: "channel",
      description: "The channel you want to list the members of.",
      type: "string",
      required: false,
    },
  ],
};


const leaveCmd = {
  name: "leave",
  usage: "leave",
  aliases: ["leave"],
  description: "Leave the current portal.",
  longDescription:
    "This command will leave the current portal in a specific channel.\n\n" +
    "You can use this command in a portal channel to leave the  portal.\n",
  args : [{
    name: "channel",
    description: "The channel you want to leave the portal in. if empty it will leave the current channel.",
    type: "string",
    required: false,
  }],

};


export const botCommands: Map<string, IBotCommand> = new Map([
  ["connect", connectCmd],
  ["setup", setupCmd],
  ["members", membersCmd],
  ["leave", leaveCmd],
]);
