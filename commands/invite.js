import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = {
  name: 'invite',
  description: 'Post a button so anyone can check their invite total',
};

export async function execute(interaction) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('check_invites')
      .setLabel('📨 Show my invites')
      .setStyle(ButtonStyle.Primary)
  );

  // Respond to the interaction
  await interaction.reply({
    content: 'Click the button to see your invite count!',
    components: [row],
    ephemeral: true, // Optional: only user can see the reply
  });
}
