import { SlashCommandBuilder } from '@discordjs/builders';
import { 
  CommandInteraction, 
  GuildMember,
  ChatInputCommandInteraction
} from 'discord.js';
import { 
  getVoiceConnection,
} from '@discordjs/voice';
import log from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the currently playing radio stream'),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Check if the user is in a voice channel
      const member = interaction.member as GuildMember;
      
      if (!member.voice.channel) {
        return await interaction.reply('You need to be in a voice channel to stop the radio!');
      }
      
      const connection = getVoiceConnection(interaction.guildId!);
      
      if (!connection) {
        return await interaction.reply('I\'m not currently playing anything!');
      }
      
      // Destroy the connection to stop the radio
      connection.destroy();
      
      await interaction.reply('⏹️ Radio stream stopped.');
      log.info(`Radio stopped by ${interaction.user.tag}`);
      
    } catch (error) {
      log.error(`Stop command error: ${error}`);
      await interaction.reply('There was an error while trying to stop the radio.');
    }
  },
}; 