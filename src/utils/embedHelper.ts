import { EmbedBuilder, EmbedFooterOptions } from 'discord.js';

// Standard branding and footer text
export const BRAND_COLOR = 0x3498db; // Blue color for consistent branding
export const DEFAULT_FOOTER = { text: 'Created by DFanso • radio.dfanso.dev' };

/**
 * Creates an embed with consistent styling and default footer
 */
export function createEmbed(options: {
  title?: string;
  description?: string;
  thumbnail?: string;
  image?: string;
  footer?: EmbedFooterOptions;
  color?: number;
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(options.color || BRAND_COLOR);

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  
  // Always include the footer, but allow customization while keeping branding
  const footerText = options.footer?.text 
    ? `${options.footer.text} • Created by DFanso • radio.dfanso.dev`
    : DEFAULT_FOOTER.text;
    
  embed.setFooter({ 
    text: footerText,
    iconURL: options.footer?.iconURL 
  });

  return embed;
}

/**
 * Adds the standard footer to an existing embed if it doesn't already have one
 */
export function addStandardFooter(embed: EmbedBuilder): EmbedBuilder {
  const currentFooter = embed.data.footer?.text;
  
  if (!currentFooter || !currentFooter.includes('radio.dfanso.dev')) {
    embed.setFooter(DEFAULT_FOOTER);
  }
  
  return embed;
} 