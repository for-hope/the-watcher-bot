import { CommandInteraction } from "discord.js";
import { Server } from "../db/serversClient";
import { getGuild } from "../utils/bot_utils";
import { IValidation } from "./Validator";

export class ServerValidator {
  //IMPORTANT => FLAGS 100 ~ 199
  public static FLAGS = {
    SERVER_EXISTS_BOT: 100,
    DIFFERENT_SERVER: 101,
    SERVER_SETUP: 102,
  };

  private serverId: string = "";
  private interaction: CommandInteraction;
  constructor(interaction: CommandInteraction, serverId: string) {
    this.interaction = interaction;
    this.serverId = serverId;
  }

  public serverExistsOnBot = (): IValidation => {
    const server = getGuild(this.interaction.client, this.serverId);
    if (!server)
      return {
        isValid: false,
        message:
          "Cannot connect to that server! Make sure I'm a member and setup correctly in that server.",
      };
    return {
      isValid: true,
      message: "Target server exists on bot.",
    };
  };

  public isDifferentServer = (): IValidation => {
    if (this.serverId === this.interaction.guildId)
      return {
        isValid: false,
        message: "The serverId is the same as the current server.",
      };
    return {
      isValid: true,
      message: "",
    };
  };

  public isServerSetup = async (setup: boolean): Promise<IValidation> => {
    const notValidMessage = `The server you're trying to interact with is not setup. Please let an admin know.`;
    try {
      const server = await Server.get(this.serverId);
      const dashboard = await server.dashboardChannel(this.interaction.client);

      return {
        //true if opposite is false and dashboard exists or opposite is true and dashboard does not exist
        isValid: setup ? !!dashboard : !dashboard,
        message: !!dashboard
          ? `[ServerValidator] Server {${this.serverId}} is already setup.`
          : notValidMessage,
      };
    } catch (e) {
      console.error(e);
      return {
        isValid: setup ? false : true,
        message: notValidMessage,
      };
    }
  };

  public validateFlag = async (flag: number): Promise<IValidation> => {
    const flagMap: { [key: number]: IValidation } = {
      [ServerValidator.FLAGS.SERVER_EXISTS_BOT]: this.serverExistsOnBot(),
      [ServerValidator.FLAGS.DIFFERENT_SERVER]: this.isDifferentServer(),
      [ServerValidator.FLAGS.SERVER_SETUP]: await this.isServerSetup(true),
    };

    return flagMap[flag];
  };
}
