import { REST } from "@discordjs/rest";
import fs from "fs";
import { Routes } from "discord-api-types/v9";
import { clientId, guildIds, token } from "./config.json";
import path from "path";

const commandsPath = path.join(__dirname, "commands");
const commands = [];
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(token);

for (const guildId of guildIds) {
  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log("Successfully registered application commands."))
    .catch(console.error);
}

// rest
//   .put(Routes.applicationCommands(clientId), { body: commands })
//   .then(() => console.log("Successfully registered application commands."))
//   .catch(console.error);

// (async () => {
//   try {
//     console.log("Started refreshing application (/) commands.");

//     await rest.put(Routes.applicationCommands(clientId), { body: commands });

//     console.log("Successfully reloaded application (/) commands.");
//   } catch (error) {
//     console.error(error);
//   }
// })();
