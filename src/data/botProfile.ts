interface BotProfile {
  name: string;
  version: string;
  description: string;
  author: string;
  website?: string;
  github?: string;
  supportServer?: string;
  avatarUrl: string;
  features: string[];
}

export const botProfile: BotProfile = {
  name: "Hemaka",
  version: "1.0.0",
  description: "I'm Hemaka, aka @hephyrian. I was replaced by AI because I can't come to Discord very often—I'm working and don't have a stable connection. So, my friends replaced me with a Discord bot. Thanks 🍒 (Also, I like Black girls and BDSM.)",
  author: "DFanso",
  avatarUrl: "https://media.discordapp.net/attachments/1013493794383089694/1355083021375635456/WhatsApp_Image_2025-03-27_at_13.45.44_18585a1e.jpg?ex=67e7a2e8&is=67e65168&hm=fc899e54cdd11f8b51e00b1c9569d0e65ba29d082ab80aae9977c61ff12c579e&=&format=webp&width=1037&height=1069", 
  features: [
    "Multiple lofi radio stations",
    "High-quality audio streaming",
    "Easy-to-use commands",
    "24/7 music playback",
    "Curated music selection",
    "Server-specific settings"
  ],
  github: "https://github.com/DFanso/vibe-music",
  supportServer: "https://discord.gg/DcFFdcjfAf" 
};

// Helper functions to get bot information
export const getBotProfile = () => botProfile;
export const getBotVersion = () => botProfile.version;
export const getBotName = () => botProfile.name;
export const getBotDescription = () => botProfile.description; 