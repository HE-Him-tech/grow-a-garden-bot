import { Events } from 'discord.js';

export default {
  name: 'inviteEvents', // descriptive name for your custom event collection
  once: false,
  async register(client) {
    // Initialize the invite cache map if it doesn't exist
    if (!client.guildInvites) {
      client.guildInvites = new Map();
    }

    // Cache invites on guild join
    client.on(Events.GuildCreate, async (guild) => {
      try {
        const invites = await guild.invites.fetch();
        client.guildInvites.set(guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
        console.log(`Cached invites for guild: ${guild.name}`);
      } catch (error) {
        console.error(`Failed to fetch invites for guild ${guild.name}:`, error);
      }
    });

    // Update cache on invite create
    client.on(Events.InviteCreate, async (invite) => {
      try {
        const invites = await invite.guild.invites.fetch();
        client.guildInvites.set(invite.guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
        console.log(`Updated invites cache after invite create in guild: ${invite.guild.name}`);
      } catch (error) {
        console.error(`Failed to update invites after invite create in guild ${invite.guild.name}:`, error);
      }
    });

    // Update cache on invite delete
    client.on(Events.InviteDelete, async (invite) => {
      try {
        const invites = await invite.guild.invites.fetch();
        client.guildInvites.set(invite.guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
        console.log(`Updated invites cache after invite delete in guild: ${invite.guild.name}`);
      } catch (error) {
        console.error(`Failed to update invites after invite delete in guild ${invite.guild.name}:`, error);
      }
    });
  },
};
