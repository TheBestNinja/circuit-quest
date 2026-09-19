# Circuit Quest — Asset Credits

All artwork and audio used in this project are **open-licensed** (prefer CC0). Nothing was scraped from Room Recess, Math Quest, or other proprietary educational game sites.

## Packs used

### 1. Space Shooter Redux — Kenney.nl
- **License:** [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
- **Author:** Kenney (www.kenney.nl)
- **Source:** [OpenGameArt — Space Shooter Redux](https://opengameart.org/content/space-shooter-redux)
- **Direct file:** `https://opengameart.org/sites/default/files/SpaceShooterRedux.zip`
- **Also:** https://kenney.nl/assets/space-shooter-redux
- **Used for:** Player ships, enemies, lasers, backgrounds, power-ups, shield/star icons, effect sprites, SFX (`sfx_laser`, `sfx_zap`, `sfx_shieldUp`, `sfx_lose`, `sfx_twoTone`), Kenvector Future font
- **Attribution:** Optional; credit “Kenney.nl” appreciated

### 2. UI Pack — Kenney.nl
- **License:** [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
- **Author:** Kenney (www.kenney.nl)
- **Source:** [OpenGameArt — UI Pack](https://opengameart.org/content/ui-pack)
- **Direct file:** `https://opengameart.org/sites/default/files/kenney_ui-pack.zip`
- **Also:** https://kenney.nl/assets/ui-pack
- **Used for:** Rectangle/round button sprites (blue/green/grey variants) under `public/assets/ui/`
- **Attribution:** Optional; credit “Kenney.nl” appreciated

## Local paths

```
public/assets/
  backgrounds/   # tiled space backgrounds
  ships/         # player chassis sprites
  enemies/       # firewall / adversary sprites
  lasers/        # projectile VFX
  powerups/      # pills, stars, shields
  effects/       # fire / impact frames
  meteors/       # optional hazard art
  ui/            # Kenney UI pack buttons + space-pack UI
  fonts/         # kenvector_future.ttf
  sfx/           # ogg sound effects
```

## Fallback note

If any pack fails to download in a future rebuild, the game UI still runs with Phaser rectangles/text (see `src/ui/Button.ts`). Ship/enemy images are loaded in `BootScene`; missing keys would show missing-texture warnings — prefer re-fetching the CC0 zips above.

## License summary

| Pack                 | License | Commercial OK | Attribution required |
|----------------------|---------|---------------|----------------------|
| Space Shooter Redux  | CC0     | Yes           | No (appreciated)     |
| UI Pack              | CC0     | Yes           | No (appreciated)     |
