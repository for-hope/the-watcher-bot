//create class called Embed

import {
  ButtonInteraction,
  ClientUser,
  CommandInteraction,
  EmbedAuthorData,
  EmbedFooterData,
  Guild,
  GuildManager,
  MessageEmbed,
  User,
} from "discord.js";
import { APP_URL } from "./constants";

export enum EmbedStatus {
  INFO = "#0099ff",
  ERROR = "#ff5252",
  SUCCESS = "#4BB543",
  WARNING = "#ffc107",
  DEFAULT = "#4740A4",
}

export enum EmbedAction {
  USER_ACTION = "USER_ACTION",
  BOT_ACTION = "BOT_ACTION",
  GUILD_ACTION = "GUILD_ACTION",
}

export enum EmbedFooterType {
  WEBSITE = "WEBSITE",
  BOT = "BOT",
  GUILD = "GUILD",
  USER = "USER",
}

export interface IEmbedProps {
  embedStatus: EmbedStatus;
  embedAction?: EmbedAction;

  embedFooterType?: EmbedFooterType;
}

export class Embed {
  //create constructor
  constructor(
    public title?: string,
    public description?: string,
    public fields?: { name: string; value: string }[],
    public customColor?: number,
    public embedProps: IEmbedProps = {
      embedStatus: EmbedStatus.DEFAULT,
    },

    public clientUser?: ClientUser,
    public guild?: Guild,
    public author?: User
  ) {
    this.title = title;
    this.description = description;
    this.fields = fields;
    this.embedProps = embedProps;
    this.customColor = customColor;
    this.clientUser = clientUser;
    this.guild = guild;
    this.author = author;
  }

  //create method called build
  build() {
    const embed = new MessageEmbed();
    if (this.title) embed.setTitle(this.title);
    if (this.description) embed.setDescription(this.description);
    if (this.fields) embed.addFields(this.fields);
    if (this.customColor) embed.setColor(this.customColor);
    else embed.setColor(this.embedProps.embedStatus);
    if (this.embedProps.embedFooterType) embed.setFooter(this._getFooter());
    if (this.embedProps.embedAction) embed.setAuthor(this._getAuthor());
    embed.setTimestamp();

    return embed;
  }

  _getFooter(): EmbedFooterData | null {
    const footerType = this.embedProps.embedFooterType;
    let embedData: EmbedFooterData;
    switch (footerType) {
      case EmbedFooterType.WEBSITE:
        embedData = {
          text: APP_URL,
          iconURL: this.clientUser?.displayAvatarURL(),
        };
        break;
      case EmbedFooterType.BOT:
        embedData = {
          text: this.clientUser?.tag!,
          iconURL: this.clientUser?.displayAvatarURL(),
        };
        break;
      case EmbedFooterType.GUILD:
        embedData = {
          text: this.guild?.name!,
          iconURL: this.guild?.iconURL() ?? undefined,
        };
        break;
      case EmbedFooterType.USER:
        embedData = {
          text: this.author?.tag!,
          iconURL: this.author?.displayAvatarURL(),
        };
        break;
      default:
        return null;
    }

    return embedData;
  }

  _getAuthor(): EmbedAuthorData | null {
    const embedAction = this.embedProps.embedAction;
    let embedData: EmbedAuthorData;
    switch (embedAction) {
      case EmbedAction.USER_ACTION:
        embedData = {
          name: this.author?.tag!,
          iconURL: this.author?.displayAvatarURL(),
        };
        break;
      case EmbedAction.BOT_ACTION:
        embedData = {
          name: this.clientUser?.tag!,
          iconURL: this.clientUser?.displayAvatarURL(),
        };
        break;
      case EmbedAction.GUILD_ACTION:
        embedData = {
          name: this.guild?.name!,
          iconURL: this.guild?.iconURL() ?? undefined,
        };
        break;
      default:
        return null;
    }
    return embedData;
  }
}
