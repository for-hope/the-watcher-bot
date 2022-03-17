import { CommandInteraction } from "discord.js";
import { IPortalDocument } from "../db/portalClient";
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
        message: "Target server does not exist on bot.",
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

  public isServerSetup = async (setup?: boolean): Promise<IValidation> => {
    const notValidMessage = `The server you're trying to interact with is not setup. Please let an admin know.`;
    try {
      const server = await Server.get(this.interaction.guildId!);
      const dashboard = server.dashboardChannelId;
      return {
        //true if opposite is false and dashboard exists or opposite is true and dashboard does not exist
        isValid: setup ? !!dashboard : !dashboard,
        message: dashboard ? "Server is already setup." : notValidMessage,
      };
    } catch (e) {
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
      [ServerValidator.FLAGS.SERVER_SETUP]: await this.isServerSetup(),
    };

    return flagMap[flag];
  };
}
