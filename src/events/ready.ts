import { Client } from "discord.js";
import { startCollectors } from "../services/start_collectors";
import config from "../config.json";

module.exports = {
  name: "ready",
  once: true,
  execute(client: Client) {
    console.log(`Ready! Logged in as ${client.user?.tag} in ${process.env.NODE_ENV} mode`);
    //start request collectors
    if (process.env.NODE_ENV === "production") {
      startCollectors(client);
    }
  },
};
