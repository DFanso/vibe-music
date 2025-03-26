import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import config from './utils/config';
import log from './utils/logger';


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.GuildIntegrations,
  ],
});

// Always use .ts files during development (running with ts-node/nodemon)
const fileExtension = '.ts';

const eventFiles = fs
  .readdirSync(path.join(__dirname, 'events'))
  .filter((file) => file.endsWith(fileExtension));

log.info(`Loading ${eventFiles.length} events...`);

for (const file of eventFiles) {
  const event = require(path.join(__dirname, 'events', file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
    log.info(`Registered 'once' event: ${event.name}`);
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
    log.info(`Registered 'on' event: ${event.name}`);
  }
}

log.warn('Bot is starting...');
log.info('Attempting to log in with token...');
client.login(config.TOKEN)
  .then(() => log.success('Login successful'))
  .catch((error) => {
    log.error('Login failed:');
    log.error(error);
  });
