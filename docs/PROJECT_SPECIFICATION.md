# Gamiarc â€” Persistent Project Specification & Technical Reference

> **Source**: Antigravity Project Specification (Persistent Reference Document)  
> **Repository**: [github.com/Bubu02/Gamiarc](https://github.com/Bubu02/Gamiarc)  
> **Status**: Architectural Blueprint & Reference (Not a command to build every planned feature immediately)

---

## Quick Reference Summary

| Parameter | Value |
|---|---|
| **Project** | Gamiarc |
| **Repository** | `github.com/Bubu02/Gamiarc` |
| **Target Framework** | Next.js + React (App Router) |
| **Language** | JavaScript |
| **Styling** | CSS / CSS Modules; avoid unnecessary dependencies (Tailwind CDN in current prototype to be migrated to build-time CSS/CSS Modules) |
| **V1 Gameplay** | Browser-first; no continuous server communication |
| **V1 Storage** | `localStorage`; `IndexedDB` only when genuinely needed |
| **V1 Backend** | No database / auth / API unless genuinely required |
| **Hosting** | Hostinger Business (Lightweight server load, browser-driven gameplay) |
| **Core Principle** | Browser handles gameplay; Gamiarc server handles the platform |

---

## 1. Product Vision

### Core Product
- A premium, lightweight platform for discovering and playing browser-based mini-games.
- **Anonymous play**: Users can play immediately without creating an account.
- **Dedicated Game Pages**: Every game has a permanent, readable URL and an isolated module.
- **Extensible Architecture**: Adding a new game must not require rewriting the platform core.

### Long-Term Direction (Not V1)
- Optional user accounts/profiles, cloud save, persistent leaderboards, community features, game articles/blog, advertising, and stronger service/database isolation when scale requires.
- *Rule*: Do **not** implement future features in V1 simply because they appear in this document.

---

## 2. Non-Negotiable Architecture Principles

### Browser-First Gameplay
- The browser performs the game loop, rendering, input handling, rules, and normal gameplay state.
- **No continuous server polling or game-event streaming**.
- Anonymous gameplay must function 100% independently of any backend.

### Platform vs. Games Separation of Concerns
- **Platform components** own: navigation, global layout, discovery, categories/search, SEO, ad slots, and future account infrastructure.
- **Game modules** own: gameplay logic, game state, local assets, game storage adapters, and game-specific styling.
- **Boundary rule**: Games must never directly manipulate navbar/footer internals, other games, or global database/auth internals.

### Isolation & Sandboxing
- Use separate folders/modules and storage namespaces for each game.
- Each game must be wrapped in a game-specific React Error Boundary so a crashed game never breaks the platform or navigation.
- Keep game engines decoupled and isolated.

### Performance
- **Zero game-engine leaks on the homepage**: Do not load game engines on the homepage or catalogue.
- Games are loaded only on their dedicated page using dynamic/lazy loading.
- Avoid unnecessary external packages, heavy global state stores (e.g. Redux), polling, or bloated bundles.

---

## 3. Technology Rules

### Approved Tech
- Next.js App Router with React.
- Vanilla JavaScript.
- Build-time CSS / CSS Modules (eliminating Tailwind CDN overhead).
- HTML5 Canvas where a game genuinely benefits from it.
- `localStorage` for anonymous saves; `IndexedDB` only for structured/heavier client data.

### Restricted / Avoid in V1
- Tailwind CDN in production.
- Redux / heavy global state management libraries.
- Bloated third-party UI component libraries.
- Docker / microservices / premature database & backend authentication infrastructure.

---

## 4. Existing Prototype & Migration Rules

1. **Inspect Repository First**: Always inspect actual existing code and assets before changing architecture.
2. **Preserve Established UI**: Preserve the recognizable Gamiarc design and proven behaviorsâ€”do not redesign from scratch.
3. **Migration Workflow**:
   - Use a dedicated migration branch (`feature/nextjs-migration`).
   - Commit working state before major changes.
   - Do not delete old prototype files until the Next.js version is thoroughly tested and verified.
   - Never mutate unrelated game logic while working on platform architecture.

---

## 5. Visual & UI Design System

### Brand Aesthetics
- Dark, premium, futuristic, clean, understated glassmorphism.
- Strictly avoid childish, garish, casino-style, or generic esports themes.

### Reference Tokens
- **Background**: Near-black `#050505` (with navy deep `#0a0a1a` / `#0a0a0a`).
- **Accent Colors**: Electric Blue `#0d59f2` / `#2563eb`, Neon Purple `#9d00ff` / `#a855f7`.
- **Typography**: `Inter` (body / UI) and `Outfit` (headings / brand logo).
- **Surfaces**: Rounded cards (`16px+`), glass surfaces (`backdrop-filter: blur(16px)`), subtle borders (`rgba(255, 255, 255, 0.07)` to `0.1`), restrained glows and smooth micro-animations.

### Navigation Direction
- **Desktop**: Top glass navbar â€” Logo (`Gamiarc`), Navigation links (`Home`, `Games`, `Leaderboards`, `Community`), Search input, `Sign In` action.
- **Mobile**: Fixed bottom navigation bar with icons (`Home`, `Games`, `Leaderboard`, `Community`).
- *Honesty Rule*: Do not present future placeholder features as fully functional.

---

## 6. Target Project Architecture

```
Gamiarc/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ layout.js                     # Global layout, fonts, metadata
â”‚   â”œâ”€â”€ page.js                       # Platform Homepage
â”‚   â”œâ”€â”€ globals.css                   # Design tokens, base CSS, reset
â”‚   â”œâ”€â”€ games/
â”‚   â”‚   â”œâ”€â”€ page.js                   # Games Library & discovery
â”‚   â”‚   â”œâ”€â”€ tic-tac-toe/
â”‚   â”‚   â”‚   â””â”€â”€ page.js               # Dedicated Tic-Tac-Toe game page
â”‚   â”‚   â””â”€â”€ ludo/
â”‚   â”‚       â””â”€â”€ page.js               # Dedicated Ludo game page
â”‚   â”œâ”€â”€ leaderboards/
â”‚   â”‚   â””â”€â”€ page.js                   # Leaderboards page (V1 placeholder / mock)
â”‚   â”œâ”€â”€ community/
â”‚   â”‚   â””â”€â”€ page.js                   # Community page
â”‚   â””â”€â”€ blog/
â”‚       â””â”€â”€ page.js                   # Game articles & updates
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ layout/                       # Navbar, MobileNav, Footer
â”‚   â”œâ”€â”€ games/                        # GameCard, GameGrid, GameShell, GameHeader, GameControls, GameInfo, RelatedGames, GameErrorBoundary
â”‚   â””â”€â”€ ui/                           # Button, Badge, Search, Modal, Tabs
â”œâ”€â”€ games/
â”‚   â”œâ”€â”€ tic-tac-toe/                  # game.js, config.js, storage.js, styles.css
â”‚   â””â”€â”€ ludo/                         # game.js, config.js, storage.js, styles.css
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ games.js                      # Central Game Registry
â”‚   â”œâ”€â”€ storage.js                    # Browser storage abstraction layer
â”‚   â”œâ”€â”€ constants.js                  # Brand tokens, site metadata
â”‚   â””â”€â”€ utils.js                      # Shared helpers
â””â”€â”€ public/
    â”œâ”€â”€ images/                       # Thumbnails, hero assets, logos
    â”œâ”€â”€ games/                        # Static game-specific assets
    â””â”€â”€ icons/                        # SVGs and UI icons
```

---

## 7. Game Registry (Single Source of Truth)

Central metadata repository located in `lib/games.js`. Homepage, Games library, search, categories, and related game recommendations all query this single registry.

### Registry Schema:
```javascript
{
  id: "tic-tac-toe",
  slug: "tic-tac-toe",
  name: "Neon Tic-Tac-Toe",
  description: "Classic strategy game reimagined with stunning neon aesthetics. Challenge AI or play pass-and-play.",
  category: "Strategy", // Strategy, Board, Puzzle, Action, Arcade, Casual
  thumbnail: "/images/games/tic-tac-toe.webp",
  featured: true,
  rating: 4.9,
  playersCount: "1-2",
  playTime: "1-3 min",
  status: "published" // "published" | "beta" | "coming-soon"
}
```

---

## 8. Game Contract & Storage Abstraction

### Game Contract
Each game must provide:
1. `config.js`: Metadata, modes, difficulty settings, keybindings.
2. `game.js`: Isolated game engine/component mounting into a container.
3. `styles.css`: Scoped CSS to prevent leakage into global styles.
4. `storage.js`: Adapter implementing the standard storage interface.

### Storage Interface & Namespacing
All anonymous data is stored in the browser with explicit namespaces:
- Prefix pattern: `gamiarc_game_<game_slug>_*` (e.g. `gamiarc_game_tic_tac_toe_scores`).
- Standard API:
  - `saveGameData(gameId, key, value)`
  - `loadGameData(gameId, key, fallback)`
  - `clearGameData(gameId)`
- Games never access other games' keys or raw unbounded storage keys.

---

## 9. GameShell & Dedicated Game Pages

- **GameShell Component**: Reusable wrapper owning the page layout:
  - Game header (title, category, rating, live player count)
  - Game arena / viewport
  - Score / turn status indicators
  - Game controls (reset match, difficulty, mode switcher, fullscreen, sound)
  - Platform ad slot placeholder
  - "How to Play" guide & rules
  - Game details & specs
  - Related games recommendation strip
- Games only render inside the `game area`. They do not duplicate headers, footers, or navigation.

---

## 10. SEO, Accessibility & Reliability

- **SEO**: Static metadata generation (`generateMetadata`), canonical tags, Open Graph cards, descriptive semantic `h1`-`h3`, JSON-LD structured data.
- **Accessibility**: ARIA labels on all interactive icons, visible `:focus-visible` outlines, semantic buttons/links, screen reader status announcements.
- **Error Boundaries**: Every game is enclosed in a `<GameErrorBoundary fallback={<GameCrashNotice />}>`. A game crash never breaks the navigation or platform.

---

## 11. Development Sequence

- **Phase 1 â€” Foundation**: Inspect repository, setup Next.js foundation preserving UI, establish design tokens and responsive layout, construct Navbar, MobileNav, and Footer.
- **Phase 2 â€” Game Platform**: Implement Game Registry (`lib/games.js`), `GameCard`, `GameGrid`, `GameShell`, `GameErrorBoundary`, and dedicated game-page dynamic route template.
- **Phase 3 â€” Validation**: Fully migrate `Tic-Tac-Toe`, then `Neon Ludo`. Validate isolation, controls, and gameplay before expanding.
- **Phase 4 â€” Storage**: Implement browser storage abstraction with per-game namespacing.
- **Phase 5 â€” Quality**: Filter & search implementation, SEO meta, accessibility review, responsive audits (320px to 1440px+).
- **Phase 6 â€” Deployment**: Hostinger deployment testing (static export or lightweight Node.js runtime).
- **Phase 7 â€” Expansion**: Add future games, followed by accounts, cloud saves, leaderboards, and community as separate standalone milestones.

---

## 12. Source-of-Truth Priority

When implementing or resolving ambiguities, prioritize in this order:
1. **Explicit current user requirement**
2. **This project specification (`docs/PROJECT_SPECIFICATION.md`)**
3. **Existing working Gamiarc behavior and design**
4. **Standard Next.js / React modern web development best practices**

