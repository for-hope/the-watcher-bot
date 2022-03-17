import { IPortalDocument } from "../db/portalClient";
import { IValidation } from "./Validator";

export class PortalValidator {
  //IMPORTANT FLAGS 200 ~ 299
  public static FLAGS = {
    PORTAL_EXISTS: 200,
    PORTAL_OWNER: 201,
    CAN_BAN: 202,
    IS_NOT_BANNED: 203,
  };
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

  public serverExists = (targetServerId: string): IValidation => {
    const server = this.portal?.findServer(targetServerId);
    if (!server)
      return {
        isValid: false,
        message: "Target server does not exist on portal.",
      };
    return {
      isValid: true,
      message: "Target server exists on portal.",
    };
  };

  serverOwner = (): IValidation => {
    if (this.serverId !== this.portal?.originServerId)
      return {
        isValid: false,
        message:
          "Your server is doesn't have owner permissions on this portal.",
      };
    return {
      isValid: true,
      message: "Your server has owner permissions.",
    };
  };

  public canBan = async (targetServerId: string): Promise<IValidation> => {
    if (!this.portalExists().isValid) return this.portalExists();

    if (!this.serverExists(targetServerId).isValid)
      return this.serverExists(targetServerId);

    if (!this.serverOwner().isValid) return this.serverOwner();

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

  public isNotBanned = async (): Promise<IValidation> => {
    if (this.portal?.isServerBlacklisted(this.serverId)) {
      return {
        isValid: false,
        message: "This server is banned from this portal.",
      };
    }
    return {
      isValid: true,
      message: "",
    };
  };

  public validateFlag = async (flag: number): Promise<IValidation> => {
    const flagMap: { [key: number]: IValidation } = {
      [PortalValidator.FLAGS.PORTAL_EXISTS]: this.portalExists(),
      [PortalValidator.FLAGS.PORTAL_OWNER]: this.serverOwner(),
      [PortalValidator.FLAGS.CAN_BAN]: await this.canBan(this.serverId),
    };

    return flagMap[flag];
  };
}
