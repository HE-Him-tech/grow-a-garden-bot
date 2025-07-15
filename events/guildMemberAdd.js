import { Events, EmbedBuilder } from 'discord.js';
import Invite from '../models/invites.js';
import MemberInvite from '../models/memberInvite.js';

// You need to import the guildInvites map from index or a shared module.
// I recommend exporting it from index.js so events can access it.
import { guildInvites } from '../utilis/cache.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const cachedInvites = guildInvites.get(member.guild.id);
    const newInvites = await member.guild.invites.fetch();

    guildInvites.set(member.guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));

    const usedInvite = newInvites.find(inv => {
      const prevUses = cachedInvites?.get(inv.code) ?? 0;
      return inv.uses > prevUses;
    });

    if (!usedInvite) return;

    const inviter = usedInvite.inviter;

    // Prevent self-invite or alt accounts (account age < 1 day)
    const accountAge = Date.now() - member.user.createdAt;
    if (inviter.id === member.id || accountAge < 1000 * 60 * 60 * 24) return;

    const guildId = member.guild.id;
    const userId = inviter.id;

    await Invite.findOneAndUpdate(
      { guildId, userId },
      { $inc: { inviteCnt: 1 } },
      { upsert: true, new: true }
    );

    await MemberInvite.findOneAndUpdate(
      { guildId, memberId: member.id },
      { inviterId: inviter.id },
      { upsert: true, new: true }
    );

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x3b7a57)
      .setTitle('Welcome to Grow a Garden 🌱')
      .setDescription(`
Hey **${member.user.username}**, welcome to the server!

You’ve joined a community of Roblox players who love unlocking rewards.

Invite 4 friends and get Access to the exclusive Tools to get Rich Fast!

In Order to get started check out <#1392281559071068262>

You Have Been Invited by **${inviter.tag}** 
      `)
      .setImage('https://media.discordapp.net/attachments/1392281559377121422/1394488116026413226/standard_1.gif?ex=6876fdc3&is=6875ac43&hm=68980cf7f23831ee731b4fb63ae8495e41e261f28c5cf4b680eefbc76f07df02&=&width=936&height=120')

    try {
      await member.send({ embeds: [welcomeEmbed] });
    } catch {
      console.log(`Couldn't DM ${member.user.tag}`);
    }
  },
};
