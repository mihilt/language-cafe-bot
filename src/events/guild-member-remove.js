import { Events } from 'discord.js';
import NewMember from '../models/NewMember.js';

export default {
  name: Events.GuildMemberRemove,
  execute: async (member) => {
    NewMember.destroy({
      where: { id: member.id },
    });
  },
};
