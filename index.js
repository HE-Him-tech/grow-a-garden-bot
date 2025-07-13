import { Client, GatewayIntentBits, Events, Collection, Partials } from 'discord.js';
import mongoose from 'mongoose';
import fs from 'node:fs';
import http from 'http';
import path from 'node:path';
import config from './config.js';
import Invite from './models/invites.js';
import MemberInvite from './models/memberInvite.js'; // 👈 make sure this file exists

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.commands = new Collection();

const foldersPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(foldersPath, file);
  const command = await import(`file://${filePath}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

client.once(Events.ClientReady, async readyClient => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);

  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }

  // Cache invites for all guilds
  for (const guild of client.guilds.cache.values()) {
    const invites = await guild.invites.fetch();
    guildInvites.set(guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
  }
});

const guildInvites = new Map();

client.on(Events.GuildCreate, async guild => {
  const invites = await guild.invites.fetch();
  guildInvites.set(guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
});

client.on(Events.InviteCreate, async invite => {
  const invites = await invite.guild.invites.fetch();
  guildInvites.set(invite.guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
});

client.on(Events.InviteDelete, async invite => {
  const invites = await invite.guild.invites.fetch();
  guildInvites.set(invite.guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
});

client.on(Events.GuildMemberAdd, async member => {
  const cachedInvites = guildInvites.get(member.guild.id);
  const newInvites = await member.guild.invites.fetch();

  guildInvites.set(member.guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));

  if (!cachedInvites) {
    console.warn(`No cached invites found for guild ${member.guild.id}`);
    return;
  }

  const usedInvite = newInvites.find(inv => {
    const prevUses = cachedInvites.get(inv.code);
    return inv.uses > (prevUses || 0);
  });

  if (!usedInvite) return;

  const accountAge = Date.now() - member.user.createdAt;
  if (usedInvite.inviter.id === member.id || accountAge < 1000 * 60 * 60 * 24) {
    console.log(`⚠️ Possible alt or self-invite by ${member.user.tag} – ignoring.`);
    return;
  }

  const guildId = member.guild.id;
  const userId = usedInvite.inviter.id;

  const inviterData = await Invite.findOneAndUpdate(
    { guildId, userId },
    { $inc: { inviteCnt: 1 } },
    { upsert: true, new: true }
  );

  await MemberInvite.findOneAndUpdate(
    { guildId, memberId: member.id },
    { inviterId: usedInvite.inviter.id },
    { upsert: true, new: true }
  );

  // 🎉 Role reward logic (e.g., give role at 4 invites)
  const roleId = '1392717264230289409'; // ← replace with your real role ID
  if (inviterData.inviteCnt >= 4) {
    const inviterMember = await member.guild.members.fetch(userId).catch(() => null);
    if (inviterMember && !inviterMember.roles.cache.has(roleId)) {
      await inviterMember.roles.add(roleId).catch(console.error);
      console.log(`✅ Gave role to ${inviterMember.user.tag} for reaching 4 invites.`);
    }
  }

  try {
    await member.send(`👋 Welcome to **${member.guild.name}**! You were invited by **${usedInvite.inviter.tag}**.`);
  } catch (err) {
    console.log(`❌ Couldn't DM ${member.user.tag}`);
  }

  console.log(`➕ Stored mapping: ${member.id} ← ${usedInvite.inviter.id}`);
});

client.on(Events.GuildMemberRemove, async member => {
  const guildId = member.guild.id;
  console.log(`➖ ${member.user.tag} left ${member.guild.name}`);

  const mapping = await MemberInvite.findOneAndDelete({ guildId, memberId: member.id });
  if (!mapping) {
    console.log('  ↳ No inviter record found – nothing to decrement.');
    return;
  }

  const inviter = await Invite.findOne({ guildId, userId: mapping.inviterId });
  if (!inviter) {
    console.log('  ↳ Inviter record missing – no update done.');
    return;
  }

  inviter.inviteCnt = Math.max(inviter.inviteCnt - 1, 0);
  await inviter.save();

  console.log(`  ↳ New total for inviter: ${inviter.inviteCnt}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} found.`);
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      const message = { content: 'There was an error while executing this command!', ephemeral: true };
      interaction.replied || interaction.deferred
        ? await interaction.followUp(message)
        : await interaction.reply(message);
    }
  }

  if (interaction.isButton() && interaction.customId === 'check_invites') {
    const inviter = await Invite.findOne({ guildId: interaction.guild.id, userId: interaction.user.id });
    const count = inviter?.inviteCnt ?? 0;

    await interaction.reply({
      content: `📨 You have invited **${count}** member(s)!`,
      ephemeral: true,
    });
  }
});

client.login(config.token);
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Dummy server listening on port ${PORT}`);
});
