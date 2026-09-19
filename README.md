# Circuit Quest

**Circuit Quest** is an educational browser game: a kids math / adventure RPG themed around **tech, circuits, and gadgets** (not fantasy magic). Built with **Phaser 3**, **Vite**, and **TypeScript**.

Solve math-fact challenges to punch through firewalls, equip gadgets and chassis, and load **Tech** abilities (Plasma Bolt, Nano Repair, Force Barrier, Cryo Lock, Arc Discharge, Warp Jump). Progress saves to `localStorage`; optional **Firebase** Auth + Firestore sync when configured.

> Original game — not a copy of Math Quest / Room Recess.

## Quick start

```bash
cd circuit-quest
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

`npm run preview` serves the `dist/` folder (default port `4173`).

## Controls

- **Mouse / touch:** click buttons (answers, tech, hub tabs)
- **Keyboard-friendly UI:** large hit targets; desktop browser first
- Full-viewport Phaser canvas (`Phaser.Scale.RESIZE`)

## Gameplay loops (MVP)

1. **Title** — Start New / Continue / Account
2. **Command Hub** — loadout tabs: **Maps**, **Weapons** (gadgets), **Armor** (chassis), **Tech**, **Skills**, **Modules**
3. **Battle / Challenge** — multiple-choice math facts
   - Correct → damage firewall + XP/credits + Energy regen
   - Wrong → Energy cost + incoming damage (unless Warp Jump is armed)
   - Equipped Tech abilities spend **Energy / Charge** with cooldowns and VFX
4. **Progression** — level, XP, credits, owned gear in `localStorage`
5. **Firebase** (optional) — email/password + Google button; cloud save when signed in

Terminology: **Tech / Energy / Charge** — never Magic / Spells / Mana.

## Project layout

```
circuit-quest/
  public/assets/     # CC0 Kenney art (see ASSETS.md)
  src/
    main.ts
    game/scenes/     # Boot, Title, Hub, Battle
    data/            # tech, equipment, math questions
    systems/         # Progression, FirebaseService
    ui/              # Button helpers
  .env.example
  ASSETS.md
  README.md
```

## Firebase setup

1. Create a Firebase project and enable **Email/Password** and (optionally) **Google** sign-in.
2. Create a web app and copy the config values.
3. Copy `.env.example` → `.env.local` and fill in:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

4. Create a Firestore collection `players` (documents keyed by Auth UID). Rules example for development only:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

5. Restart `npm run dev`.

If Firebase env vars are missing, the game shows a **guest-mode banner** and saves only locally. Account UI still opens; Sign In / Google ask you to use Guest until configured.

**Do not commit** `.env` / `.env.local` or real API keys.

## Assets

See [ASSETS.md](./ASSETS.md) for pack names, URLs, and CC0 licenses (Kenney Space Shooter Redux + UI Pack via OpenGameArt).

## Scripts

| Command           | Description                |
|-------------------|----------------------------|
| `npm run dev`     | Vite dev server            |
| `npm run build`   | Typecheck + production build |
| `npm run preview` | Preview production build   |

## License

Game code: MIT (or as declared by the repository owner).  
Art/audio: CC0 Kenney packs — see ASSETS.md.
