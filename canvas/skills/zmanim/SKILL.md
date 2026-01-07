---
name: zmanim
description: |
  Display Jewish halachic times (zmanim) for any date and location.
  Use when users ask about prayer times, Jewish times, or zmanim.
---

# Zmanim Canvas

Display Jewish halachic times (zmanim) for any date and location.

## Usage

1. First, fetch zmanim data from the Hebcal API for the requested location and date
2. Then spawn the canvas with the fetched data

```bash
# Step 1: Fetch data from Hebcal API
# https://www.hebcal.com/zmanim?cfg=json&geonameid=281184&date=2026-01-07

# Step 2: Spawn the canvas (runs in new terminal window)
bun run src/cli.ts spawn zmanim --config '{
  "date": "2026-01-07",
  "hebrewDate": "ז׳ טבת תשפ״ו",
  "location": {
    "name": "Jerusalem",
    "latitude": 31.77,
    "longitude": 35.22,
    "timezone": "Asia/Jerusalem"
  },
  "times": [
    {"id": "alot", "name": "Dawn (Alot HaShachar)", "hebrewName": "עלות השחר", "time": "05:23"},
    {"id": "misheyakir", "name": "Earliest Tallit", "hebrewName": "משיכיר", "time": "05:46"},
    {"id": "sunrise", "name": "Sunrise (Netz)", "hebrewName": "נץ החמה", "time": "06:40"},
    {"id": "sofZmanShma", "name": "Latest Shema (GRA)", "hebrewName": "סוף זמן ק\"ש", "time": "09:13"},
    {"id": "sofZmanTfilla", "name": "Latest Shacharit", "hebrewName": "סוף זמן תפילה", "time": "10:04"},
    {"id": "chatzot", "name": "Midday (Chatzot)", "hebrewName": "חצות היום", "time": "11:45"},
    {"id": "minchaGedola", "name": "Earliest Mincha", "hebrewName": "מנחה גדולה", "time": "12:11"},
    {"id": "minchaKetana", "name": "Mincha Ketana", "hebrewName": "מנחה קטנה", "time": "14:44"},
    {"id": "plagHaMincha", "name": "Plag HaMincha", "hebrewName": "פלג המנחה", "time": "15:47"},
    {"id": "sunset", "name": "Sunset (Shkiah)", "hebrewName": "שקיעה", "time": "16:51"},
    {"id": "tzeit", "name": "Nightfall (72 min)", "hebrewName": "צאת הכוכבים", "time": "18:03"}
  ]
}'
```

## Scenarios

### `display` (default)
View-only display of halachic times with:
- Location header with Star of David icon
- Date display (Gregorian + Hebrew)
- List of times with icons, English/Hebrew names
- Arrow marker on the next upcoming time
- Scroll support for long lists

## Configuration

```typescript
interface ZmanimConfig {
  date: string;            // ISO date (YYYY-MM-DD)
  hebrewDate?: string;     // Hebrew date display (e.g., "ז׳ טבת תשפ״ו")
  location: {
    name: string;          // "Jerusalem", "New York", etc.
    latitude: number;
    longitude: number;
    timezone: string;      // "Asia/Jerusalem", "America/New_York"
  };
  times: HalachicTime[];
  title?: string;          // Optional custom title (default: "Jewish Times")
}

interface HalachicTime {
  id: string;              // "alot", "sunrise", "sunset", etc.
  name: string;            // English name
  hebrewName: string;      // Hebrew name
  time: string;            // "HH:MM" format
  passed?: boolean;        // Has this time passed today?
}
```

## Standard Zmanim IDs

| ID | English | Hebrew | Icon |
|----|---------|--------|------|
| alot | Dawn (Alot HaShachar) | עלות השחר | 🌅 |
| misheyakir | Earliest Tallit | משיכיר | 🌫️ |
| sunrise | Sunrise (Netz) | נץ החמה | ☀️ |
| sofZmanShma | Latest Shema (GRA) | סוף זמן ק"ש | 📖 |
| sofZmanTfilla | Latest Shacharit | סוף זמן תפילה | 🙏 |
| chatzot | Midday (Chatzot) | חצות היום | 🌞 |
| minchaGedola | Earliest Mincha | מנחה גדולה | 🕐 |
| minchaKetana | Mincha Ketana | מנחה קטנה | 🕓 |
| plagHaMincha | Plag HaMincha | פלג המנחה | 🌥️ |
| sunset | Sunset (Shkiah) | שקיעה | 🌇 |
| tzeit | Nightfall (3 stars) | צאת הכוכבים | 🌙 |

## Controls

- `q` or `Esc`: Quit
- `↑/k`: Scroll up
- `↓/j`: Scroll down
- `PageUp/PageDown`: Page scroll

## Data Source

Fetch zmanim data from the Hebcal API:
```
https://www.hebcal.com/zmanim?cfg=json&geonameid={GEONAMEID}&date={YYYY-MM-DD}
```

Common geonameid values:
- Jerusalem: 281184
- Tel Aviv: 293397
- New York: 5128581
- Los Angeles: 5368361
- London: 2643743
