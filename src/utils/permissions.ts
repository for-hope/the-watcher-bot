import {
  ButtonInteraction,
  CommandInteraction,
  Guild,
  GuildMemberRoleManager,
  Permissions,
  Role,
} from "discord.js";
import { getAdminRoles } from "../db/serversClient";

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
  let adminRoleIds = await getAdminRoles((interaction.guild as Guild).id);
  if (!adminRoleIds) {
    return false;
  }

  const roles = interaction?.member?.roles as GuildMemberRoleManager;
  const hasManagerRole: boolean = roles.cache.some((role: Role) =>
    (adminRoleIds as string[]).includes(role.id)
  );

  if (!hasManagerRole) {
    return false;
  }

  return true;
};

export const hasManagerPermission = async (
  interaction: CommandInteraction | ButtonInteraction
): Promise<boolean> => {
  const managerRole = await hasManagerRole(interaction);
  const botManagerRole = await hasBotManagerRole(interaction);
  if (!managerRole && !botManagerRole) {
    const adminRoleIds = await getAdminRoles((interaction.guild as Guild).id);
    console.log(adminRoleIds);
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
