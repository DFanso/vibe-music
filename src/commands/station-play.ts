import { SlashCommandBuilder } from '@discordjs/builders';
import { 
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ComponentType
} from 'discord.js';
import log from '../utils/logger';
import { radioStations } from '../data/radioStations';

// Categorize stations for easier selection
const stationCategories = [
  {
    name: 'Lofi Hip Hop',
    stations: radioStations.filter(s => 
      s.name.toLowerCase().includes('lofi') || 
      s.description.toLowerCase().includes('lofi')
    )
  },
  {
    name: 'Ambient / Chill',
    stations: radioStations.filter(s => 
      s.description.toLowerCase().includes('ambient') || 
      s.description.toLowerCase().includes('chill') ||
      s.name.toLowerCase().includes('chill')
    )
  },
  {
    name: 'Focus / Study',
    stations: radioStations.filter(s => 
      s.description.toLowerCase().includes('focus') || 
      s.description.toLowerCase().includes('study') ||
      s.name.toLowerCase().includes('focus')
    )
  },
  {
    name: 'All Stations',
    stations: radioStations
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('station-play')
    .setDescription('Browse and play a radio station with button selection'),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Create embed to display categories
      const embed = new EmbedBuilder()
        .setTitle('📻 Radio Station Categories')
        .setDescription('Select a category to browse stations')
        .setColor(0x3498db);
      
      // Create category buttons
      const row = new ActionRowBuilder<ButtonBuilder>();
      stationCategories.slice(0, 5).forEach((category, index) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`category_${index}`)
            .setLabel(category.name)
            .setStyle(ButtonStyle.Primary)
        );
      });
      
      // Send initial message with category selection
      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
      
      const message = await interaction.fetchReply();
      
      // First collector for category selection
      const categoryCollector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000 // 1 minute
      });
      
      categoryCollector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: 'These buttons are not for you!',
            ephemeral: true
          });
          return;
        }
        
        // Stop the category collector since a category was selected
        categoryCollector.stop();
        
        // Extract category index from button ID
        const categoryIndex = Number(i.customId.split('_')[1]);
        const selectedCategory = stationCategories[categoryIndex];
        
        // Create embed with stations from selected category
        const stationsEmbed = new EmbedBuilder()
          .setTitle(`📻 ${selectedCategory.name} Stations`)
          .setDescription('Click a button to play a station')
          .setColor(0x3498db);
        
        // Create station buttons (up to 5 per row, max 3 rows/15 stations)
        const stationRows: ActionRowBuilder<ButtonBuilder>[] = [];
        let currentRow = new ActionRowBuilder<ButtonBuilder>();
        let rowCount = 0;
        
        selectedCategory.stations.slice(0, 15).forEach((station, index) => {
          if (index > 0 && index % 5 === 0) {
            stationRows.push(currentRow);
            currentRow = new ActionRowBuilder<ButtonBuilder>();
            rowCount++;
            
            if (rowCount >= 3) return; // Max 3 rows
          }
          
          currentRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`play_${station.id}`)
              .setLabel(station.name)
              .setStyle(ButtonStyle.Success)
          );
        });
        
        if (currentRow.components.length > 0) {
          stationRows.push(currentRow);
        }
        
        // Add back button
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('back_to_categories')
              .setLabel('Back to Categories')
              .setStyle(ButtonStyle.Secondary)
          );
        
        if (stationRows.length < 3) {
          stationRows.push(backRow);
        }
        
        // Update message with station selection
        await i.update({
          embeds: [stationsEmbed],
          components: stationRows
        });
        
        // Second collector for station selection
        const stationCollector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60000 // 1 minute
        });
        
        stationCollector.on('collect', async j => {
          if (j.user.id !== interaction.user.id) {
            await j.reply({
              content: 'These buttons are not for you!',
              ephemeral: true
            });
            return;
          }
          
          // Handle back button
          if (j.customId === 'back_to_categories') {
            await j.update({
              embeds: [embed],
              components: [row]
            });
            stationCollector.stop();
            return;
          }
          
          // Extract station ID from button ID
          const stationId = j.customId.split('_')[1];
          
          // Acknowledge the button click
          await j.deferUpdate();
          
          // Execute the play command
          try {
            const playCommand = require('./play.ts');
            
            // Create a new interaction-like object for the play command
            const playOptions = {
              getString: () => stationId
            };
            
            const playInteraction = {
              ...j,
              options: playOptions
            };
            
            // Execute the command
            await playCommand.execute(playInteraction);
            stationCollector.stop();
          } catch (error) {
            log.error(`Error executing play command: ${error}`);
            await j.followUp({
              content: 'There was an error playing this station.',
              ephemeral: true
            });
          }
        });
        
        stationCollector.on('end', () => {
          // This executes after the collector times out
          // Don't update the message as the play command will handle it
        });
      });
      
      categoryCollector.on('end', collected => {
        if (collected.size === 0) {
          // No button was clicked, remove the buttons
          interaction.editReply({
            components: []
          }).catch(() => {});
        }
      });
      
    } catch (error) {
      log.error(`Station-play command error: ${error}`);
      await interaction.reply('There was an error while executing this command.');
    }
  }
}; 