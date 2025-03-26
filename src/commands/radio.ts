import { SlashCommandBuilder } from '@discordjs/builders';
import { 
  CommandInteraction, 
  GuildMember,
  ChatInputCommandInteraction
} from 'discord.js';
import { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
  NoSubscriberBehavior
} from '@discordjs/voice';
import log from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Play a radio stream from a URL')
    .addStringOption(option => 
      option.setName('url')
        .setDescription('The URL of the radio stream')
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      // Check if the user is in a voice channel
      const member = interaction.member as GuildMember;
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        return await interaction.editReply('You need to be in a voice channel to use this command!');
      }

      // Get the URL from command options
      const url = interaction.options.getString('url');
      
      if (!url) {
        return await interaction.editReply('Please provide a valid URL for the radio stream.');
      }

      // Create a connection to the voice channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
      });

      // Handle connection errors
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch (error) {
          connection.destroy();
        }
      });

      // Create an audio player
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play,
        },
      });
      
      // Create an audio resource directly from the URL (for radio streams)
      try {
        // For direct audio streams, we create the resource directly
        const resource = createAudioResource(url, {
          inputType: StreamType.Arbitrary,
          inlineVolume: true,
        });
        
        if (resource.volume) {
          resource.volume.setVolume(0.5); // Set initial volume to 50%
        }
        
        // Play the audio
        player.play(resource);
        connection.subscribe(player);
        
        await interaction.editReply(`🎵 Now playing radio from: ${url}`);
        
        // Handle errors and track end
        player.on(AudioPlayerStatus.Idle, () => {
          log.info('Radio stream ended or disconnected');
          // For radio streams, we can try to recreate the resource to keep playing
          try {
            const newResource = createAudioResource(url, {
              inputType: StreamType.Arbitrary,
            });
            player.play(newResource);
          } catch (e) {
            log.error(`Failed to restart stream: ${e}`);
          }
        });
        
        player.on('error', error => {
          log.error(`Error playing radio: ${error.message}`);
          interaction.followUp('There was an error playing the radio stream.');
        });
        
      } catch (error) {
        log.error(`Error streaming from URL: ${error}`);
        await interaction.editReply('Failed to play this stream. Please check the URL and try again.');
      }
      
    } catch (error) {
      log.error(`Radio command error: ${error}`);
      await interaction.editReply('There was an error while executing this command.');
    }
  },
}; 