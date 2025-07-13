import { ActionRowBuilder, ButtonBuilder } from 'discord.js';

export const data = {
  name: 'invite',
  description: 'Post a button so anyone can check their invite total',
};

export async function execute(message) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('check_invites')
      .setLabel('📨 Show my invites')
      .setStyle('Primary')
  );

  await message.channel.send({
    content: 'Click the button to see your invite count!',
    components: [row],
  });
}