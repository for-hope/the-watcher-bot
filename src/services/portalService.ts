import { Client } from "discord.js";
import {
  IPortalDocument,
  IPortalServer,
  PortalRequest,
} from "../db/portalClient";
import { CONNECTION_REQUEST_STATUS } from "../utils/bot_embeds";
import { getMessage, getTextChannel } from "../utils/bot_utils";

export const updateRequestStatusMessage = async (
  client: Client,
  portalServer: IPortalServer,
  status: PortalRequest
): Promise<void> => {
  const msg = await getMessage(
    client,
    portalServer.requestMessage.id,
    portalServer.requestMessage.channel_id
  );

  if (msg) {
    const embed = msg.embeds[0];
    console.log(embed);

    embed.fields[0].value = CONNECTION_REQUEST_STATUS(status);
    await msg.edit({ embeds: [embed] });
  }
};
