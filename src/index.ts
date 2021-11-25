// Require the necessary discord.js classes
import { Client, Intents, Collection, Message } from "discord.js";
import { token } from "./config.json";
import path from "path";
import { readdir, readdirSync } from "fs";
import { connectDb } from "./db/dbClient";

export interface ClientExpended extends Client {
  commands?: Collection<string, (event: runEvent) => any>;
}
export interface runEvent {
  message: Message;
  client: Client;
  args: string[];
  dev: boolean;
}

const fileExtention = process.env.NODE_ENV === "development" ? ".ts" : ".js";
console.log(`About to run on ` + process.env.NODE_ENV);

// Create a new client instance
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
}) as ClientExpended;

connectDb();

const eventsDir = path.resolve(__dirname, "events");
const commandsDir = path.resolve(__dirname, "commands");

const eventFiles = readdirSync(eventsDir).filter((file) =>
  file.endsWith(fileExtention)
);

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

const commands: Collection<string, (event: runEvent) => any> =
  new Collection();

client.commands = commands;

const commandFiles = readdirSync(commandsDir).filter((file) =>
  file.endsWith(fileExtention)
);

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  commands.set(command.data.name, command);
}

// Login to Discord with your client's token
client.login(token);
