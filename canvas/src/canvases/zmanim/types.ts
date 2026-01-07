// Zmanim Canvas Types - Jewish halachic times display

export interface HalachicTime {
  id: string;          // "alot", "sunrise", "sunset", etc.
  name: string;        // English name
  hebrewName: string;  // Hebrew name (e.g., "עלות השחר")
  time: string;        // "HH:MM" format
  passed?: boolean;    // Has this time passed today?
}

export interface ZmanimLocation {
  name: string;        // "Jerusalem", "New York", etc.
  latitude: number;
  longitude: number;
  timezone: string;    // "Asia/Jerusalem", "America/New_York"
}

export interface ZmanimConfig {
  date: string;            // ISO date (YYYY-MM-DD)
  hebrewDate?: string;     // Hebrew date display (e.g., "ז׳ טבת תשפ״ו")
  location: ZmanimLocation;
  times: HalachicTime[];
  title?: string;          // Optional custom title
}

// Icon mapping for each zman type
export const ZMAN_ICONS: Record<string, string> = {
  alot: "🌅",
  misheyakir: "🌫️",
  sunrise: "☀️",
  sofZmanShma: "📖",
  sofZmanTfilla: "🙏",
  chatzot: "🌞",
  minchaGedola: "🕐",
  minchaKetana: "🕓",
  plagHaMincha: "🌤️",
  sunset: "🌅",
  tzeit: "🌙",
};

// Default icon for unknown zman types
export const DEFAULT_ZMAN_ICON = "⏰";
