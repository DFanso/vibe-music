import { Client } from 'discord.js';

module.exports = {
  name: 'ready',
  once: true,
  execute(client: Client) {
    console.log('='.repeat(40));
    console.log(`Bot is now online as: ${client.user?.tag}`);
    console.log(`Bot ID: ${client.user?.id}`);
    console.log(`Serving ${client.guilds.cache.size} guild(s)`);
    console.log('='.repeat(40));
  },
};
