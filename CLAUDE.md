# bog — Binding of Goofe

A cute Binding of Isaac-style dungeon crawler starring Goofe, Scott's girlfriend's stuffed animal.
Deployed to `bog.scottzockoll.com`.

## Concept

- Top-down roguelike dungeon crawler, room by room
- Goofe-themed: cute aesthetic, soft colors, plush/toy art direction
- Two-player co-op via WebSocket multiplayer
- Spectate mode for watching active sessions
- Isaac-style mechanics: items, tears, rooms, bosses — all Goofe-flavored

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Renderer**: HTML5 Canvas (no game engine — all custom)
- **Bundler**: Vite
- **Testing**: Vitest + @vitest/coverage-v8 (100% coverage required)
- **Multiplayer**: WebSocket service shared with goofenet (`src/lib/ws.ts`)

## Architecture Principles

- **Everything is a class**: All game entities, systems, scenes, and managers are classes.
- **Readable first**: Code is co-authored between Scott and Claude. Prioritize clarity over cleverness.
- **No magic numbers**: All constants live in `src/constants.ts`.
- **100% unit test coverage**: Every class and method must be tested. No exceptions.
- **Separation of concerns**: Game logic is pure (no canvas/DOM deps) so it can be unit tested cleanly.
  The `Renderer` class is the only thing that touches the canvas.

## Project Structure

```
src/
  constants.ts          # All magic numbers and config values
  main.ts               # Entry point — boots the Game
  lib/
    ws.ts               # WebSocket client (copied from goofenet)
  game/
    Game.ts             # Top-level game loop and state machine
    Room.ts             # A single dungeon room
    Floor.ts            # A floor (collection of rooms + map)
    Dungeon.ts          # Full run (collection of floors)
  entities/
    Entity.ts           # Base class for everything in the world
    Player.ts           # The player (Goofe)
    Enemy.ts            # Base enemy class
    Tear.ts             # Projectile (Goofe's tears)
    Item.ts             # Pickup / passive item
    Door.ts             # Room transition door
    Boss.ts             # Boss enemy (extends Enemy)
  systems/
    CollisionSystem.ts  # AABB collision detection
    ItemSystem.ts       # Item pickup and stat effects
    SpawnSystem.ts      # Enemy and item spawning rules
    MultiplayerSystem.ts # WebSocket sync for co-op and spectate
  scenes/
    Scene.ts            # Base scene class
    TitleScene.ts       # Title / main menu
    GameScene.ts        # Active gameplay
    GameOverScene.ts    # Death screen
    LobbyScene.ts       # Multiplayer lobby (host/join/spectate)
  rendering/
    Renderer.ts         # Draws everything to the canvas
    SpriteSheet.ts      # Loads and slices sprite sheets
    Camera.ts           # Follows the player, handles viewport
  ui/
    HUD.ts              # Health, coins, keys, map display
    Menu.ts             # Reusable menu component
tests/
  game/
  entities/
  systems/
  scenes/
  rendering/
  ui/
```

## Multiplayer Design

- Rooms are identified by a `roomId` (floor + coordinates)
- Each co-op session has a unique `sessionId` used as the WebSocket room key
- The host runs the authoritative game loop; the client sends inputs and receives state
- Spectators join as read-only: they receive state updates but send no inputs
- WebSocket message types: `player-input`, `game-state`, `room-transition`, `spectate-join`

## Code Quality

- No `any` types. No placeholder comments. No TODOs left in committed code.
- All classes have JSDoc on the class itself and any non-obvious methods.
- Run `npm test` to verify coverage before committing.
- The game must run with `npm run dev` and build cleanly with `npm run build`.

## Secrets

- Never hardcode secrets or URLs.
- WebSocket URL and API key come from environment variables: `VITE_WS_URL`, `VITE_WS_API_KEY`.

## Naming Conventions

- Classes: `PascalCase`
- Files: match the class name exactly (`Player.ts` exports `class Player`)
- Constants: `SCREAMING_SNAKE_CASE` in `constants.ts`
- Methods and variables: `camelCase`
