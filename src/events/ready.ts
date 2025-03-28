import { ActivityType, Client, PresenceStatusData } from 'discord.js';
import log from '../utils/logger';
import { botProfile } from '../data/botProfile';
import { radioStations } from '../data/radioStations';

module.exports = {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    if (!client.user) return;

    // Set the bot's username if it's different
    if (client.user.username !== botProfile.name) {
      try {
        await client.user.setUsername(botProfile.name);
      } catch (error) {
        log.warn('Could not update username. This is normal if it was changed recently.');
      }
    }

    // Set bot description via application
    try {
      await client.application?.edit({
        description: botProfile.description
      });
    } catch (error) {
      log.warn('Could not update application description. This is normal if it was changed recently.');
    }

    // Set the bot's avatar
    try {
      const currentAvatar = client.user.displayAvatarURL();
      if (currentAvatar !== botProfile.avatarUrl) {
        // Try to fetch the image first to validate it
        const response = await fetch(botProfile.avatarUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          await client.user.setAvatar(Buffer.from(buffer));
          log.info('Successfully updated bot avatar');
        } else {
          log.error(`Failed to fetch avatar image: ${response.statusText}`);
        }
      }
    } catch (error) {
      log.error(`Failed to update avatar: ${error}`);
    }

    // Define different presence configurations
    const presenceConfigs = [
      {
        activities: [{
          name: `${radioStations.length} Music Stations 🎷`,
          type: ActivityType.Listening
        }],
        status: 'online' as PresenceStatusData
      },
      {
        activities: [{
          name: `${client.guilds.cache.size} servers 🌐`,
          type: ActivityType.Watching
        }],
        status: 'online' as PresenceStatusData
      },
      {
        activities: [{
          name: '/help | /play 🎧',
          type: ActivityType.Playing
        }],
        status: 'idle' as PresenceStatusData
      },
      {
        activities: [{
          name: 'your study session 📚',
          type: ActivityType.Watching
        }],
        status: 'dnd' as PresenceStatusData
      }
    ];

    // Log bot information
    log.botInfo(client.user.tag, client.user.id, client.guilds.cache.size);

    // Initial presence
    client.user.setPresence(presenceConfigs[0]);

    // Rotate through different presence configurations every 2 minutes
    let configIndex = 1; // Start from 1 since we already used 0
    setInterval(() => {
      client.user?.setPresence(presenceConfigs[configIndex]);
      configIndex = (configIndex + 1) % presenceConfigs.length;
    }, 2 * 60 * 1000); // 2 minutes

    // Custom status messages that rotate every 5 minutes
    const customStatuses = [
      '🎵 Lofi & Chill',
      '🎧 Study with me',
      '📻 24/7 Music',
      '🌙 Late night vibes',
      '📚 Focus mode',
      '💭 Relaxing beats',
      '🎶 Ambient sounds',
      '🌿 Zen mode',
      '⭐ Premium quality',
      '🎹 Piano lofi',
      ...botProfile.features.map(feature => `✨ ${feature}`)
    ];

    let statusIndex = 0;
    setInterval(() => {
      const status = customStatuses[statusIndex];
      client.user?.setActivity(status);
      statusIndex = (statusIndex + 1) % customStatuses.length;
    }, 5 * 60 * 1000); // 5 minutes
  },
};
