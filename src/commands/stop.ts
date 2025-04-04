import { SlashCommandBuilder } from '@discordjs/builders';
import { 
  CommandInteraction, 
  GuildMember,
  ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js';
import { 
  getVoiceConnection,
} from '@discordjs/voice';
import log from '../utils/logger';
import { BRAND_COLOR } from '../utils/embedHelper';

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

      // Get the player from the connection
      const player = (connection as any).state.subscription?.player;
      
      // Clean up any existing listeners on the player
      if (player?.cleanup) {
        try {
          player.cleanup();
        } catch (e) {
          log.error(`Error cleaning up player listeners: ${e}`);
        }
      }
      
      // Destroy the connection to stop the radio
      try {
        connection.destroy();
      } catch (e) {
        // Ignore errors if connection is already destroyed
        log.debug('Connection was already destroyed');
      }
      
      const embed = new EmbedBuilder()
        .setTitle('⏹️ Radio Stopped')
        .setDescription('The radio stream has been stopped.')
        .setColor(BRAND_COLOR)
        .setFooter({ text: 'Created by DFanso • radio.dfanso.dev' });
      
      await interaction.reply({ embeds: [embed] });
      log.info(`Radio stopped by ${interaction.user.tag}`);
      
    } catch (error) {
      log.error(`Stop command error: ${error}`);
      await interaction.reply('There was an error while trying to stop the radio.');
    }
  },
}; 