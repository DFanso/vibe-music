import { SlashCommandBuilder } from '@discordjs/builders';
import { 
  CommandInteraction, 
  GuildMember,
  EmbedBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags
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
import { BRAND_COLOR } from '../utils/embedHelper';

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
          try {
            connection.destroy();
          } catch (e) {
            // Ignore errors if connection is already destroyed
          }
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
            flags: MessageFlags.Ephemeral
          });
          
          // Try each alternative station until one works
          for (const altStation of alternativeStations) {
            const altResult = await playStation(interaction, connection, player, altStation);
            if (altResult.success) {
              await interaction.followUp({
                content: `The original station failed, so I'm playing ${altStation.name} instead.`,
                flags: MessageFlags.Ephemeral
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

// Helper function to create control buttons
function createControlButtons(isPlaying: boolean = true) {
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('pause_resume')
        .setEmoji(isPlaying ? '⏸️' : '▶️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('stop')
        .setEmoji('😵')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('volume_down')
        .setEmoji('🔉')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('volume_up')
        .setEmoji('🔊')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('refresh')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary)
    );
  return row;
}

// Helper function to play a station and handle errors
async function playStation(
  interaction: ChatInputCommandInteraction, 
  connection: any, 
  player: any, 
  station: typeof radioStations[0]
): Promise<{ success: boolean }> {
  try {
    // Set max listeners to prevent memory leak warning
    connection.setMaxListeners(15);

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
      .setColor(BRAND_COLOR)
      .setThumbnail(station.imgUrl)
      .addFields(
        { name: 'Station ID', value: station.id, inline: true },
        { name: 'URL', value: `[Stream Link](${station.url})`, inline: true },
        { name: 'Volume', value: '50%', inline: true }
      )
      .setFooter({ text: 'Use the buttons below to control playback • Created by DFanso • radio.dfanso.dev' });

    // Send embed with control buttons
    const controlRow = createControlButtons(true);
    const message = await interaction.editReply({ 
      embeds: [embed],
      components: [controlRow]
    });

    // Set up button collector
    const collector = message.createMessageComponentCollector({ 
      componentType: ComponentType.Button,
      time: 3600000 // 1 hour
    });

    collector.on('collect', async (i) => {
      // Verify the user who clicked is in the voice channel
      const member = i.member as GuildMember;
      if (!member.voice.channel) {
        await i.reply({ 
          content: 'You need to be in a voice channel to use these controls!',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      switch (i.customId) {
        case 'pause_resume':
          if (player.state.status === AudioPlayerStatus.Playing) {
            player.pause();
            embed.data.fields![2].value = '⏸️ Paused';
            await i.update({ embeds: [embed], components: [createControlButtons(false)] });
          } else {
            player.unpause();
            embed.data.fields![2].value = '▶️ Playing';
            await i.update({ embeds: [embed], components: [createControlButtons(true)] });
          }
          break;

        case 'stop':
          connection.destroy();
          embed.data.fields![2].value = '⏹️ Stopped';
          await i.update({ 
            embeds: [embed], 
            components: [] 
          });
          collector.stop();
          break;

        case 'volume_down':
          if (resource.volume) {
            const currentVolume = resource.volume.volume;
            const newVolume = Math.max(0, currentVolume - 0.1);
            resource.volume.setVolume(newVolume);
            embed.data.fields![2].value = `${Math.round(newVolume * 100)}%`;
            await i.update({ embeds: [embed] });
          }
          break;

        case 'volume_up':
          if (resource.volume) {
            const currentVolume = resource.volume.volume;
            const newVolume = Math.min(1, currentVolume + 0.1);
            resource.volume.setVolume(newVolume);
            embed.data.fields![2].value = `${Math.round(newVolume * 100)}%`;
            await i.update({ embeds: [embed] });
          }
          break;

        case 'refresh':
          try {
            const newResource = createAudioResource(station.url, {
              inputType: StreamType.Arbitrary,
              inlineVolume: true
            });
            if (newResource.volume) {
              newResource.volume.setVolume(resource.volume?.volume || 0.5);
            }
            player.play(newResource);
            await i.reply({ 
              content: '🔄 Stream refreshed!',
              flags: MessageFlags.Ephemeral
            });
          } catch (error) {
            await i.reply({ 
              content: '❌ Failed to refresh stream. Please try again.',
              flags: MessageFlags.Ephemeral
            });
          }
          break;
      }
    });

    collector.on('end', () => {
      // Remove buttons after collector expires
      interaction.editReply({ components: [] }).catch(() => {});
    });
    
    // Track reconnection attempts
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
    let lastReconnectTime = Date.now();
    const RECONNECT_COOLDOWN = 5000; // 5 seconds between reconnection attempts

    // Handle errors and track end
    const idleHandler = async () => {
      const currentTime = Date.now();
      const timeSinceLastReconnect = currentTime - lastReconnectTime;

      // If we've tried too many times recently, stop trying
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        log.warn(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached for station ${station.name}. Stopping reconnection attempts.`);
        try {
          await interaction.followUp({
            content: `⚠️ Stream connection lost after ${MAX_RECONNECT_ATTEMPTS} reconnection attempts. Please try another station or try again later.`,
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          log.error(`Failed to send max attempts message: ${e}`);
        }
        return;
      }

      // If we're trying to reconnect too quickly, wait
      if (timeSinceLastReconnect < RECONNECT_COOLDOWN) {
        log.info(`Waiting ${RECONNECT_COOLDOWN - timeSinceLastReconnect}ms before attempting to reconnect...`);
        return;
      }

      log.info(`Station ${station.name} stream ended, attempting reconnection (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      
      try {
        const newResource = createAudioResource(station.url, {
          inputType: StreamType.Arbitrary,
          inlineVolume: true
        });
        
        if (newResource.volume) {
          newResource.volume.setVolume(0.5);
        }
        
        player.play(newResource);
        reconnectAttempts++;
        lastReconnectTime = Date.now();
        
        // Reset reconnection attempts after 30 seconds of successful playback
        setTimeout(() => {
          if (player.state.status === AudioPlayerStatus.Playing) {
            reconnectAttempts = 0;
            log.info(`Stream has been stable for 30 seconds, resetting reconnection counter.`);
          }
        }, 30000);
      } catch (e) {
        log.error(`Failed to restart stream: ${e}`);
        reconnectAttempts++;
      }
    };
    
    const errorHandler = async (error: Error) => {
      log.error(`Error playing radio: ${error.message}`);
      try {
        await interaction.followUp({
          content: 'There was an error playing the radio stream. Attempting to reconnect...',
          flags: MessageFlags.Ephemeral
        });
      } catch (e) {
        log.error(`Failed to send error message: ${e}`);
      }
    };

    // Remove any existing listeners before adding new ones
    player.removeAllListeners(AudioPlayerStatus.Idle);
    player.removeAllListeners('error');
    
    // Add new listeners
    player.on(AudioPlayerStatus.Idle, idleHandler);
    player.on('error', errorHandler);
    
    // Cleanup function to remove listeners
    const cleanup = () => {
      try {
        player.removeListener(AudioPlayerStatus.Idle, idleHandler);
        player.removeListener('error', errorHandler);
        collector.stop();
      } catch (e) {
        log.error(`Error cleaning up listeners: ${e}`);
      }
    };
    
    // Store cleanup function for later use
    (player as any).cleanup = cleanup;
    
    return { success: true };
  } catch (error) {
    log.error(`Error streaming from URL ${station.url}: ${error}`);
    return { success: false };
  }
} 