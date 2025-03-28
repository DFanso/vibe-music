export interface RadioStation {
  id: string;
  name: string;
  url: string;
  description: string;
  imgUrl: string;
}

export interface BotProfile {
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