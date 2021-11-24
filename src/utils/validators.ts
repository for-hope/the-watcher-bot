import { Client, Guild } from "discord.js";
import { getGuild } from "./bot_utils";

//create validators class
export class Validators {
  //validate if client is on guild
  public getGuildOrError(client: Client, guildId: string): Guild {
    
    try {
      const guild: Guild = getGuild(client, guildId);
      return guild;
    } catch (err) {
  
      throw new Error(
        "Cannot connect to that server! Make sure I'm a member and setup correctly in that server."
      );
    }
  }
}
