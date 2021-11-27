import { MessageActionRow, MessageButton } from "discord.js";
import { PortalResponses } from "../../types/portal";

export const portalRequestAction = () => {
  return new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(PortalResponses.approve)
      .setLabel("Approve")
      .setStyle("SUCCESS"),
    new MessageButton()
      .setCustomId(PortalResponses.deny)
      .setLabel("Deny")
      .setStyle("DANGER")
  );
};
