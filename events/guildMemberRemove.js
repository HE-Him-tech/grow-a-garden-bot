import Invite from '../models/invites.js';
import MemberInvite from '../models/memberInvite.js';
import { Events } from 'discord.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const guildId = member.guild.id;

    console.log(`➖ ${member.user.tag} left ${member.guild.name}`);

    // Find and delete the inviter mapping for this member
    const mapping = await MemberInvite.findOneAndDelete({
      guildId,
      memberId: member.id,
    });

    if (!mapping) {
      console.log('  ↳ No inviter record found for this member');
      return;
    }

    console.log(`  ↳ Invited by ${mapping.inviterId}. Decreasing invite count.`);

    const inviter = await Invite.findOne({
      guildId,
      userId: mapping.inviterId,
    });

    if (!inviter) {
      console.log('  ↳ Inviter record missing - no update performed');
      return;
    }

    inviter.inviteCnt = Math.max(inviter.inviteCnt - 1, 0);
    await inviter.save();

    console.log(`  ↳ New invite count for inviter: ${inviter.inviteCnt}`);
  }
};
