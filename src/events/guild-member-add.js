import { Events } from 'discord.js';
import NewMember from '../models/NewMember.js';

export default {
  name: Events.GuildMemberAdd,
  execute: async (member) => {
    const newMember = await NewMember.findOne({
      where: { id: member.id },
    });

    if (newMember) {
      return;
    }

    await NewMember.create({
      id: member.id,
    });
  },
};
