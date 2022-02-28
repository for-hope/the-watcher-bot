import { Permissions, TextChannel } from "discord.js";
import { botCommands } from "../cmds";
import { IValidationPerms, Validator } from "../validators/Validator";
import TwCmd, { ICmdStatic } from "./TWCmd";

export const ConnectCommand : ICmdStatic = class ConnectCommand extends TwCmd {
    public static COMMAND = botCommands.connect;
    DEFAULT_ERROR_MESSAGE: string = "There was an error connecting the server.";

    private _serverIdToConnect: string = "";
    private _channelToConnectOn: TextChannel | null = null;
    validationPerms: IValidationPerms = {
        botPermFlags: [Permissions.FLAGS.MANAGE_CHANNELS],
        userPermFlags: [Permissions.FLAGS.MANAGE_CHANNELS],
        customPermFlags: [Validator.FLAGS.BOT_MANAGER_ROLE],
    };
    args = () => {
        const args = botCommands.connect.args;
        const interactionOptions = this.interaction.options;
        this._serverIdToConnect = interactionOptions.getString(args.serverId.name) || "";
        this._channelToConnectOn =
            (interactionOptions.getChannel(
                args.channel.name
            ) as TextChannel | null) || (this.interaction?.channel! as TextChannel);
            
    };
    successReply(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    execute = async ():Promise<boolean>  =>{
        
        return true;
    }
};
