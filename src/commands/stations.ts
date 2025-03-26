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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stations')
    .setDescription('View a list of preset radio stations'),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Create multiple embeds to handle pagination
      const stationsPerPage = 5;
      const totalPages = Math.ceil(radioStations.length / stationsPerPage);
      const embeds: EmbedBuilder[] = [];

      for (let i = 0; i < totalPages; i++) {
        const startIdx = i * stationsPerPage;
        const endIdx = Math.min(startIdx + stationsPerPage, radioStations.length);
        const pageStations = radioStations.slice(startIdx, endIdx);
        
        const embed = new EmbedBuilder()
          .setTitle('📻 Lofi Radio Stations')
          .setDescription('Use the `/play <id>` command with the station ID to start playing.')
          .setColor(0x3498db)
          .setFooter({ 
            text: `Page ${i+1}/${totalPages} • Use /play <id> to play a station` 
          });
        
        pageStations.forEach(station => {
          embed.addFields({
            name: `${station.name} (ID: ${station.id})`,
            value: `${station.description}\n\`Use: /play ${station.id}\``
          });
        });
        
        embeds.push(embed);
      }
      
      // Create pagination buttons
      let currentPage = 0;
      
      const getButtons = (current: number) => {
        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('first')
              .setEmoji('⏮️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(current === 0),
            new ButtonBuilder()
              .setCustomId('prev')
              .setEmoji('◀️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(current === 0),
            new ButtonBuilder()
              .setCustomId('page')
              .setLabel(`${current + 1}/${totalPages}`)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('next')
              .setEmoji('▶️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(current === totalPages - 1),
            new ButtonBuilder()
              .setCustomId('last')
              .setEmoji('⏭️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(current === totalPages - 1)
          );
          
        return buttonRow;
      };
      
      // Send initial message with first page and buttons
      await interaction.reply({ 
        embeds: [embeds[currentPage]],
        components: [getButtons(currentPage)]
      });
      
      const message = await interaction.fetchReply();
      
      // Create collector for button interactions
      const collector = message.createMessageComponentCollector({ 
        componentType: ComponentType.Button,
        time: 180000 // 3 minutes
      });
      
      collector.on('collect', async i => {
        // Only the user who initiated the command can use the buttons
        if (i.user.id !== interaction.user.id) {
          await i.reply({ 
            content: 'These buttons are not for you!', 
            ephemeral: true 
          });
          return;
        }
        
        // Handle button actions
        switch (i.customId) {
          case 'first':
            currentPage = 0;
            break;
          case 'prev':
            currentPage = Math.max(0, currentPage - 1);
            break;
          case 'next':
            currentPage = Math.min(totalPages - 1, currentPage + 1);
            break;
          case 'last':
            currentPage = totalPages - 1;
            break;
        }
        
        // Update the message with new embed and buttons
        await i.update({ 
          embeds: [embeds[currentPage]],
          components: [getButtons(currentPage)]
        });
      });
      
      collector.on('end', () => {
        // Remove buttons after collector ends
        interaction.editReply({ components: [] }).catch(() => {});
      });
      
    } catch (error) {
      log.error(`Stations command error: ${error}`);
      await interaction.reply('There was an error while executing this command.');
    }
  },
}; 