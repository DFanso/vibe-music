import {
  CommandInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  Client,
  Interaction,
  Events
} from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import log from '../utils/logger';

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction, client: Client) {
    try {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        const command = require(`../commands/${interaction.commandName}.ts`);
        
        if (!command) {
          return await interaction.reply({
            content: `No command matching ${interaction.commandName} was found.`,
            ephemeral: true
          });
        }
        
        await command.execute(interaction, client);
      }
      
      // Handle autocomplete interactions
      else if (interaction.isAutocomplete()) {
        const command = require(`../commands/${interaction.commandName}.ts`);
        
        if (!command || !command.autocomplete) {
          return;
        }
        
        try {
          await command.autocomplete(interaction);
        } catch (error) {
          log.error(`Error with autocomplete for /${interaction.commandName}: ${error}`);
        }
      }
      
    } catch (error) {
      log.error(`Error handling interaction: ${error}`);
      
      if (interaction.isChatInputCommand()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ 
            content: 'There was an error while executing this command!', 
            ephemeral: true 
          });
        } else {
          await interaction.reply({ 
            content: 'There was an error while executing this command!', 
            ephemeral: true 
          });
        }
      }
    }
  }
};
