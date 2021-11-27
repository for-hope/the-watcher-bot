import { Client } from "discord.js";
import { startCollectors } from "../services/start_collectors";

module.exports = {
  name: "ready",
  once: true,
  execute(client: Client) {
    console.log(`Ready! Logged in as ${client.user?.tag}`);
    //start request collectors
    startCollectors(client);
  },
};
