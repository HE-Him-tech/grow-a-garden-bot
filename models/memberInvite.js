import mongoose from 'mongoose';

const memberInviteSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  memberId: {
    type: String,
    required: true,
  },
  inviterId: {
    type: String,
    required: true,
  },
});

export default mongoose.model('MemberInvite', memberInviteSchema);
