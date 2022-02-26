import { IPortalDocument } from "../db/portalClient";
import { IValidation } from "./Validator";

export class PortalValidator {
  private portal: IPortalDocument | null = null;
  private serverId: string = "";

  constructor(portal: IPortalDocument | null, serverId: string) {
    this.portal = portal;
    this.serverId = serverId;
  }

  public portalExists = (): IValidation => {
    if (!this.portal) {
      return {
        isValid: false,
        message: "Portal does not exist.",
      };
    }
    return {
      isValid: true,
      message: "Portal exists.",
    };
  };

  public canBan = async (targetServerId: string): Promise<IValidation> => {
    if (!this.portalExists().isValid) return this.portalExists();

    const server = this.portal?.findServer(targetServerId);
    if (!server)
      return {
        isValid: false,
        message: "Target server does not exist on portal.",
      };

    if (this.serverId !== this.portal?.originServerId)
      return {
        isValid: false,
        message:
          "Your server does not have permission to ban other server on this portal.",
      };

    if (targetServerId === this.portal?.originServerId)
      return {
        isValid: false,
        message: "You cannot ban the owner of the portal",
      };

    return {
      isValid: true,
      message: "",
    };
  };
}
