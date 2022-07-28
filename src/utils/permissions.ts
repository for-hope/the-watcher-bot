import {
  ButtonInteraction,
  CommandInteraction,
  GuildMemberRoleManager,
  Permissions,
  Role,
} from "discord.js";
import { Server } from "../db/serversClient";

export const hasManagerRole = async (
  interaction: CommandInteraction | ButtonInteraction
): Promise<boolean> => {
  const hasManagerPermission = interaction.memberPermissions?.has(
    Permissions.FLAGS.MANAGE_GUILD
  );

  if (!hasManagerPermission) {
    return false;
  }

  return true;
};

export const hasBotManagerRole = async (
  interaction: CommandInteraction | ButtonInteraction
): Promise<boolean> => {
  let adminRoleIds = (await Server.get(interaction.guildId!)).adminRoles;
  if (!adminRoleIds) return false;

  const roles = interaction?.member?.roles as GuildMemberRoleManager;
  return roles.cache.some((role: Role) =>
    (adminRoleIds as string[]).includes(role.id)
  );
};

export const hasManagerPermission = async (
  interaction: CommandInteraction | ButtonInteraction,
  noReply?: boolean
): Promise<boolean> => {
  const managerRole = await hasManagerRole(interaction);
  const botManagerRole = await hasBotManagerRole(interaction);
  if (!managerRole && !botManagerRole) {
    const adminRoleIds = (await Server.get(interaction.guildId!)).adminRoles;
    if (noReply) return false;
    await interaction.reply({
      content: `You do not have the required permissions [
          ${!managerRole ? "`Manage Server` " : ""}
          ${
            !botManagerRole && adminRoleIds
              ? adminRoleIds
                  .map((adminRoleId) => `<@&${adminRoleId}">`)
                  .join(" ")
              : ""
          }   
     ] to use this interaction.`,
      ephemeral: true,
    });
    return false;
  }
  return true;
};
