import { RadioStation } from "../types/types";

// Base URL for GitHub raw content
const imageBaseUrl = "https://raw.githubusercontent.com/DFanso/lofi-radio/main/public/images/";

// Sample list of lofi radio stations with working stream URLs
export const radioStations: RadioStation[] = [
  {
    id: "chillhop",
    name: "Chillhop",
    url: "https://ice1.somafm.com/defcon-128-mp3",
    description: "Chill instrumental beats",
    imgUrl: `${imageBaseUrl}Chillhop.png`
  },
  {
    id: "lofi-night",
    name: "Lofi Night",
    url: "https://stream.zeno.fm/f3wvbbqmdg8uv",
    description: "Lofi beats to relax to",
    imgUrl: `${imageBaseUrl}Lofi-Night.png`
  },
  {
    id: "lofi",
    name: "Lofi",
    url: "https://lofi.stream.laut.fm/lofi",
    description: "Lofi beats to relax to",
    imgUrl: `${imageBaseUrl}Lofi.png`
  },
  {
    id: "coffee-shop-vibes",
    name: "Coffee Shop Vibes",
    url: "https://streams.fluxfm.de/Chillhop/mp3-128/streams.fluxfm.de/",
    description: "Coffee shop ambience with lofi beats",
    imgUrl: `${imageBaseUrl}Coffee-Shop-Vibes.png`
  },
  {
    id: "asian-lofi",
    name: "Asian Lofi",
    url: "https://listen.moe/fallback",
    description: "Asian-inspired lofi hip hop",
    imgUrl: `${imageBaseUrl}Asian-Lofi.png`
  },
  {
    id: "synthwave",
    name: "Synthwave",
    url: "https://ice2.somafm.com/spacestation-128-mp3",
    description: "80s-inspired electronic beats",
    imgUrl: `${imageBaseUrl}Synthwave.png`
  },
  {
    id: "jazz-hop",
    name: "Jazz Hop",
    url: "https://ice4.somafm.com/gsclassic-128-mp3",
    description: "Jazz-infused hip hop beats",
    imgUrl: `${imageBaseUrl}Jazz-Hop.png`
  },
  {
    id: "sleep-beats",
    name: "Sleep Beats",
    url: "https://ice6.somafm.com/dronezone-128-mp3",
    description: "Ambient beats for sleeping",
    imgUrl: `${imageBaseUrl}Sleep-Beats.png`
  },
  {
    id: "rain-lofi",
    name: "Rain & Lofi",
    url: "https://ice1.somafm.com/fluid-128-mp3",
    description: "Lofi beats with rain sounds",
    imgUrl: `${imageBaseUrl}Rain-Lofi.png`
  },
  {
    id: "focus-beats",
    name: "Focus Beats",
    url: "https://ice2.somafm.com/deepspaceone-128-mp3",
    description: "Beats to help you focus and study",
    imgUrl: `${imageBaseUrl}Focus-Beats.png`
  },
  {
    id: "pixel-lofi",
    name: "Pixel Lofi",
    url: "https://radio.plaza.one/mp3",
    description: "Pixelated nostalgia with lofi beats",
    imgUrl: `${imageBaseUrl}Pixel-Lofi.png`
  },
  {
    id: "soma-groove-salad",
    name: "SomaFM Groove Salad",
    url: "https://ice1.somafm.com/groovesalad-128-mp3",
    description: "Ambient/downtempo beats and grooves",
    imgUrl: `${imageBaseUrl}SomaFM-Groove-Salad.png`
  },
  {
    id: "zeno-lofi-hiphop",
    name: "Zeno.FM Lofi Hip Hop",
    url: "https://stream.zeno.fm/0r0xa792kwzuv",
    description: "Smooth, relaxing chill beats",
    imgUrl: `${imageBaseUrl}Zeno.FM-Lofi-Hip-Hop.png`
  },
  {
    id: "reyfm-lofi",
    name: "REYFM – #lofi",
    url: "https://listen.reyfm.de/lofi_320kbps.mp3",
    description: "German 24/7 high-quality lofi channel with carefully curated playlists",
    imgUrl: `${imageBaseUrl}REYFM–lofi.png`
  },
  {
    id: "nightride-fm",
    name: "Nightride FM",
    url: "https://stream.nightride.fm/nightride.m4a",
    description: "24/7 streaming of nostalgic, electronic music",
    imgUrl: `${imageBaseUrl}Nightride-FM.png`
  },
  {
    id: "synthwave-radio",
    name: "Synthwave Radio",
    url: "https://stream.synthwaveradio.eu/listen/synthwaveradio.eu/radio.mp3",
    description: "Broad electronic music, including vaporwave and darksynth",
    imgUrl: `${imageBaseUrl}Synthwave-Radio.png`
  },
  {
    id: "groove-salad",
    name: "Groove Salad",
    url: "https://ice2.somafm.com/groovesalad-128-mp3",
    description: "Chilled beats, relaxed grooves",
    imgUrl: `${imageBaseUrl}Groove-Salad.png`
  },
  {
    id: "mellow-mix",
    name: "Mellow Mix",
    url: "https://stream.radioparadise.com/mellow-192",
    description: "Cozy living room for relaxation, fitting background use",
    imgUrl: `${imageBaseUrl}Mellow-Mix.png`
  }
]; 