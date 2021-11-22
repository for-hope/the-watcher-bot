import {
  ButtonInteraction,
  CommandInteraction,
  GuildMemberRoleManager,
  Permissions,
  Role,
} from "discord.js";
import { getAdminRoles } from "../db/serversClient";

export const hasManagerRole = async (
  interaction: CommandInteraction | ButtonInteraction
): Promise<boolean> => {
  const hasManagerPermission = interaction.memberPermissions.has(
    Permissions.FLAGS.MANAGE_GUILD
  );

  if (!hasManagerPermission) {
    return;
  }

  return true;
};

export const hasBotManagerRole = async (
  interaction: CommandInteraction | ButtonInteraction
): Promise<boolean> => {
  const adminRoleIds = await getAdminRoles(interaction.guild.id);
  if (!adminRoleIds) {
    return;
  }

  const hasManagerRole: boolean = (
    interaction.member.roles as GuildMemberRoleManager
  ).cache.some((role: Role) => adminRoleIds.includes(role.id));

  if (!hasManagerRole) {
    return;
  }

  return true;
};

export const hasManagerPermission = async (
  interaction: CommandInteraction | ButtonInteraction
): Promise<boolean> => {
  const managerRole = await hasManagerRole(interaction);
  const botManagerRole = await hasBotManagerRole(interaction);
  if (!managerRole && !botManagerRole) {
    await interaction.reply(
      "You do not have the required permissions [`Manage Server`] to setup the server."
    );
    return;
  }
  return true;
};
