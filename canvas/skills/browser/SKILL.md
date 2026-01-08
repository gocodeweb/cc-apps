---
name: browser
description: |
  Open a terminal browser to view web pages.
  Use when debugging web apps or viewing URLs in terminal.
---

# Browser Canvas

Opens a real web browser (browsh) in a tmux pane, rendering web pages with full JavaScript support.

## IMPORTANT: Spawn Immediately

When the user asks to "show a browser", "open localhost", or wants to debug a web app:

1. **Spawn immediately** with the URL
2. Default to `http://localhost:3000` if no URL specified

### Quick spawn example:

```bash
bun run src/cli.ts browser --url "http://localhost:3000"
```

Or with config:

```bash
bun run src/cli.ts browser --config '{"url": "http://localhost:5173"}'
```

## Prerequisites

Browsh requires **Firefox 57+** and a terminal with true color support.

### Install Firefox

**macOS:**
```bash
brew install --cask firefox
```

**Debian/Ubuntu:**
```bash
sudo apt install firefox
```

**Fedora:**
```bash
sudo dnf install firefox
```

**Arch Linux:**
```bash
sudo pacman -S firefox
```

### Install Browsh

**macOS (Homebrew):**
```bash
brew tap browsh-org/homebrew-browsh && brew install browsh
```

**Arch Linux (AUR):**
```bash
yay -S browsh-bin
```

**Debian/Ubuntu:**
```bash
# Download the .deb for your architecture from https://www.brow.sh/downloads/
sudo dpkg -i browsh_1.8.0_linux_amd64.deb
```

**Redhat/Fedora:**
```bash
# Download the .rpm for your architecture from https://www.brow.sh/downloads/
sudo rpm -i browsh_1.8.0_linux_amd64.rpm
```

**Verify installation:**
```bash
which browsh && browsh --version
```

## Configuration

```typescript
interface BrowserConfig {
  url: string;  // URL to open (default: "http://localhost:3000")
}
```

## Standard Spawn Examples

```bash
# Debug localhost dev server
bun run src/cli.ts browser --url "http://localhost:3000"

# Vite dev server
bun run src/cli.ts browser --url "http://localhost:5173"

# Any public URL
bun run src/cli.ts browser --url "https://example.com"

# Using JSON config
bun run src/cli.ts browser --config '{"url": "http://localhost:8080"}'
```

## Browsh Keybindings

### Navigation
| Key | Action |
|-----|--------|
| `Ctrl+L` or `F6` | Change URL (focus address bar) |
| `Backspace` or `Alt+←` | Go back |
| `Alt+→` | Go forward |
| `Ctrl+R` or `F5` | Reload page |
| `Arrows` | Scroll |
| `PgUp/PgDn` | Page scroll |
| `Click` | Follow link |

### Tabs
| Key | Action |
|-----|--------|
| `Ctrl+T` | New tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+W` | Close tab |

### Display
| Key | Action |
|-----|--------|
| `Alt+M` | Toggle monochrome mode |
| `Alt+U` | Toggle mobile/desktop user agent |
| `F1` | Help |
| `Ctrl+Q` | Quit browsh |

## Features

- Full JavaScript execution (SPAs, React apps work)
- Real browser rendering via headless Firefox
- Native keyboard/mouse support
- Link clicking, scrolling, tabs
- Image rendering (in supported terminals)

## Common Use Cases

1. **Debug local dev server**: See your React/Vue/Svelte app in terminal
2. **View API documentation**: Browse docs without leaving terminal
3. **Test responsive layouts**: See how pages render in text mode
4. **Access web apps over SSH**: Browse web while in remote terminal
5. **Web search**: Use DuckDuckGo for searches (see below)

## Web Search

Use **DuckDuckGo** instead of Google for searches. Google blocks browsh as "unusual traffic" because it detects headless Firefox.

```bash
# DuckDuckGo (recommended)
bun run src/cli.ts browser --url "https://duckduckgo.com/?q=your+search+terms"

# Bing (alternative)
bun run src/cli.ts browser --url "https://www.bing.com/search?q=your+search+terms"

# Startpage (Google results, privacy-friendly)
bun run src/cli.ts browser --url "https://www.startpage.com/search?q=your+search+terms"
```

**Why Google doesn't work:** Browsh uses headless Firefox which Google detects as bot-like traffic (missing cookies, WebDriver flags, automated patterns).

## Notes

- Browsh reuses the existing canvas pane if one is open
- First launch may be slow as Firefox starts up
- For best experience, use a large terminal window
