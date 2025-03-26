import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import config from './utils/config';


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

console.log(`Loading ${eventFiles.length} events...`);

for (const file of eventFiles) {
  const event = require(path.join(__dirname, 'events', file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
    console.log(`Registered once event: ${event.name}`);
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
    console.log(`Registered on event: ${event.name}`);
  }
}

console.info('Bot is starting...');
console.info('Attempting to log in with token...');
client.login(config.TOKEN)
  .then(() => console.log('Login successful'))
  .catch((error) => {
    console.error('Login failed:');
    console.error(error);
  });
