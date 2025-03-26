import { SlashCommandBuilder } from '@discordjs/builders';
import { 
  CommandInteraction, 
  GuildMember,
  EmbedBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction
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
import { radioStations } from '../data/radioStations';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a lofi radio station')
    .addStringOption(option => 
      option.setName('station')
        .setDescription('The ID of the station to play')
        .setRequired(true)
        .setAutocomplete(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      // Check if the user is in a voice channel
      const member = interaction.member as GuildMember;
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        return await interaction.editReply('You need to be in a voice channel to use this command!');
      }

      // Get the station ID from command options
      const stationId = interaction.options.getString('station');
      
      if (!stationId) {
        return await interaction.editReply('Please provide a valid station ID. Use `/stations` to see available stations.');
      }

      // Find the station by ID
      const station = radioStations.find(s => s.id === stationId);
      
      if (!station) {
        return await interaction.editReply(`Station with ID "${stationId}" not found. Use \`/stations\` to see available stations.`);
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
      
      // Try to play the selected station
      const playResult = await playStation(interaction, connection, player, station);
      
      // If it fails, try a similar station
      if (!playResult.success) {
        const alternativeStations = findAlternativeStations(station);
        
        if (alternativeStations.length > 0) {
          await interaction.followUp({
            content: `Failed to play ${station.name}. Trying an alternative station...`,
            ephemeral: true
          });
          
          // Try each alternative station until one works
          for (const altStation of alternativeStations) {
            const altResult = await playStation(interaction, connection, player, altStation);
            if (altResult.success) {
              await interaction.followUp({
                content: `The original station failed, so I'm playing ${altStation.name} instead.`,
                ephemeral: true
              });
              break;
            }
          }
        }
      }
      
    } catch (error) {
      log.error(`Play command error: ${error}`);
      await interaction.editReply('There was an error while executing this command.');
    }
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    let choices = radioStations.map(station => ({
      name: `${station.name} - ${station.description.substring(0, 50)}`,
      value: station.id
    }));
    
    if (focusedValue) {
      choices = choices.filter(choice => 
        choice.name.toLowerCase().includes(focusedValue) || 
        choice.value.toLowerCase().includes(focusedValue)
      );
    }
    
    await interaction.respond(
      choices.slice(0, 25)
    );
  }
};

// Helper function to find alternative stations
function findAlternativeStations(station: typeof radioStations[0]) {
  // Keywords in the station name or description to find similar stations
  const keywords = [
    ...station.name.toLowerCase().split(' '),
    ...station.description.toLowerCase().split(' ')
  ].filter(word => word.length > 3); // Only use words longer than 3 characters
  
  // Find stations that share keywords but aren't the original station
  const similarStations = radioStations.filter(s => {
    if (s.id === station.id) return false; // Skip the original station
    
    const nameAndDesc = `${s.name} ${s.description}`.toLowerCase();
    
    // Check if any keyword is found in the name or description
    return keywords.some(keyword => nameAndDesc.includes(keyword));
  });
  
  // If no similar stations found by keywords, return some working stations
  if (similarStations.length === 0) {
    // These are typically more reliable streams
    const reliableStations = radioStations.filter(s => 
      ['soma-groove-salad', 'sleep-beats', 'focus-beats', 'chillhop'].includes(s.id)
    );
    return reliableStations.filter(s => s.id !== station.id);
  }
  
  return similarStations;
}

// Helper function to play a station and handle errors
async function playStation(
  interaction: ChatInputCommandInteraction, 
  connection: any, 
  player: any, 
  station: typeof radioStations[0]
): Promise<{ success: boolean }> {
  try {
    // Create the resource directly from the URL
    const resource = createAudioResource(station.url, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
    });
    
    if (resource.volume) {
      resource.volume.setVolume(0.5); // Set initial volume to 50%
    }
    
    // Play the audio
    player.play(resource);
    connection.subscribe(player);
    
    // Create an embed with station info
    const embed = new EmbedBuilder()
      .setTitle(`🎵 Now Playing: ${station.name}`)
      .setDescription(station.description)
      .setColor(0x3498db)
      .setImage(station.imgUrl)
      .addFields(
        { name: 'Station ID', value: station.id, inline: true },
        { name: 'URL', value: `[Stream Link](${station.url})`, inline: true }
      )
      .setFooter({ text: 'Use /stop to stop playback' });
    
    await interaction.editReply({ embeds: [embed] });
    
    // Handle errors and track end
    player.on(AudioPlayerStatus.Idle, () => {
      log.info(`Station ${station.name} stream ended or disconnected`);
      // For radio streams, we can try to recreate the resource to keep playing
      try {
        const newResource = createAudioResource(station.url, {
          inputType: StreamType.Arbitrary,
        });
        player.play(newResource);
      } catch (e) {
        log.error(`Failed to restart stream: ${e}`);
      }
    });
    
    player.on('error', (error: Error) => {
      log.error(`Error playing radio: ${error.message}`);
      interaction.followUp('There was an error playing the radio stream.');
    });
    
    return { success: true };
  } catch (error) {
    log.error(`Error streaming from URL ${station.url}: ${error}`);
    return { success: false };
  }
} 