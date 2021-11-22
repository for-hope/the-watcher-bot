export const buttonInteraction = async (interaction): Promise<void> => {
  if (!interaction.isButton()) return;
  await teleportRequestButton(interaction);
};

const teleportRequestButton = async (interaction): Promise<void> => {
  console.log(
    `${interaction.member.user.username} requested a teleport to ${interaction.channel.name}`
  );


};
