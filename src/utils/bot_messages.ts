import { Guild, GuildMember, GuildTextBasedChannel, Role } from "discord.js";

export const TRAFFIC_CHANNEL_SETUP = (
  member: GuildMember,
  role?: Role
): string => {
  return `${(
    member as GuildMember
  ).toString()} has setup the server for inter-server communications ${
    role ? `\`Bot Manager Role:\` ${role.toString()}` : ``
  }. :white_check_mark:\n
> You can use \`/connect server_id channel\` to open a private connection portal to another server on a specific channel  (:exclamation:** You can use this with multiple servers!**)
> You can also use the command  \`/teleport dimension\` to create a channel with a dimension (topic name) and join all the other servers that have that dimension/topic channel open (:exclamation:** Be careful. These dimension channels are public!**).\n
While talking in public inter-server channels / dimensions make sure to follow the rules https://www.thewatcher.xyz/rules or your server or some members might get blacklisted :skull:\n
You can always use \`/help\` and \`/commands\` for more information.
Have fun!`;
};

export const BOT_SETUP_REPLY = (
  trafficChannel: GuildTextBasedChannel
): string => {
  return `:white_check_mark:  Setup is complete! You can now recieve portal connection requests on ${trafficChannel.toString()}`;
};

export const PORTAL_REQUEST_SENT = (
  invitedGuild: Guild,
  trafficChannel: GuildTextBasedChannel
) => {
  return `:white_check_mark: Portal request sent to ${invitedGuild.name} \`${
    invitedGuild.id
  }\`. ${
    trafficChannel
      ? `You can check the request status in ${trafficChannel.toString()}`
      : `You cannot check the request status because you don't have a valid traffic channel.`
  }`;
};

export const WELCOME_MESSAGE =
  "Hello, I am the **The Watcher Bot**. I am here to help you setup the bot in your server for interserver communication.\n\n" +
  "To setup the bot in your server, use the slash command `/setup` in any channel. and follow the given instructions\n\n" +
  "You can also use `/help` to see all the commands available to you. or visit https://thewatcherbot.com/commands for more info.";
