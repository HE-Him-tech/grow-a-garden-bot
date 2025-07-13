import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  inviteCnt: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model('Invite', inviteSchema);