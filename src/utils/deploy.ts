import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';
import path from 'path';
import config from '../utils/config';
import log from '../utils/logger';

interface Command {
  data: {
    toJSON: () => any;
  };
}

const commands: any[] = [];
const commandFoldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(commandFoldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(commandFoldersPath, folder);

  // Check if the path is a directory before proceeding
  if (fs.statSync(commandsPath).isDirectory()) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
    for (const file of commandFiles) {
      const command: Command = require(path.join(commandsPath, file));
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
  } else if (commandsPath.endsWith('.ts')) {
    // Handle files directly inside the 'commands' directory
    const command: Command = require(commandsPath);
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST({ version: '9' }).setToken(config.TOKEN);

(async () => {
  try {
    log.info(`Started refreshing ${commands.length} application (/) commands.`);

    const data: any = await rest.put(
      Routes.applicationCommands(config.CLIENT_ID),
      { body: commands },
    );

    log.success(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    log.error(`Failed to register commands: ${error}`);
  }
})();
