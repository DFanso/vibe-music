import { Client } from 'discord.js';
import log from '../utils/logger';

module.exports = {
  name: 'ready',
  once: true,
  execute(client: Client) {
    log.botInfo(client.user?.tag, client.user?.id, client.guilds.cache.size);
  },
};
