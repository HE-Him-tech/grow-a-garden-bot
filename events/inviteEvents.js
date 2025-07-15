import { Events } from 'discord.js';

export default {
  name: 'inviteEvents', // We’ll register multiple invite-related events here
  once: false,
  async register(client) {
    // Cache invites on guild join
    client.on(Events.GuildCreate, async guild => {
      const invites = await guild.invites.fetch();
      client.guildInvites.set(guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
    });

    // Update cache on invite create
    client.on(Events.InviteCreate, async invite => {
      const invites = await invite.guild.invites.fetch();
      client.guildInvites.set(invite.guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
    });

    // Update cache on invite delete
    client.on(Events.InviteDelete, async invite => {
      const invites = await invite.guild.invites.fetch();
      client.guildInvites.set(invite.guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
    });
  }
};