import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Replies with Hello!'),
  async execute(interaction: CommandInteraction) {

    try {
      await interaction.reply(`Hello, ${interaction.user}!, I'm Hemaka, aka @hephyrian. I was replaced by AI because I can't come to Discord very often—I'm working and don't have a stable connection. So, my friends replaced me with a Discord bot. Thanks 🍒 (Also, I like Black girls and BDSM.)`);
    } catch (error) {
      console.error(error);
      await interaction.reply('There was an error executing the command.');
    }
  },
};

