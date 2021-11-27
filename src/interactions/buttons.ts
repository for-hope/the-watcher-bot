import {
  ButtonInteraction,
  CommandInteraction,
  GuildTextBasedChannel,
} from "discord.js";

export const buttonInteraction = async (
  interaction: ButtonInteraction | CommandInteraction
): Promise<void> => {
  if (!interaction.isButton()) return;
  await teleportRequestButton(interaction);
};

const teleportRequestButton = async (
  interaction: ButtonInteraction
): Promise<void> => {
  console.log(
    `${
      interaction.member.user.username
    } clicked button interaction ${interaction.channel?.toString()} with interaction id : ${interaction.customId}.`
  );
};
