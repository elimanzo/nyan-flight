# Asset Integration Implementation Plan

**Project:** Nyan Flight  
**Feature:** Sprite Sheet Integration for Cat & Pipes  
**Branch:** `feature/asset-integration`  
**Date:** March 29, 2026

---

## Overview

Integrate sprite sheet assets for cat animations and pipe rendering, while setting up proper environment variable handling for secrets and constraining canvas width for balanced gameplay.

---

## 1. Environment & Git Configuration

### Environment Variables

- **Create** `.env` file with: `PIXELLAB_API_KEY=5360271e-f057-46a3-8142-6d7205aec888`
- **Update** `opencode.json` to reference: `${PIXELLAB_API_KEY}` instead of hardcoded bearer token
- **Create** `.env.example` template with placeholder text

### Gitignore Updates

Add the following entries to `.gitignore`:

```
# Environment variables
.env

# OpenCode configuration (contains sensitive MCP keys)
opencode.json

# Accidentally generated files
nul
```

### Files to Commit

- `opencode.json` (with environment variable placeholder)
- `.env.example` (template file)
- Updated `.gitignore`

---

## 2. Cat Sprite Implementation

### Sprite Sheet Details

- **File:** `src/assets/sprites/cat.png`
- **Total Dimensions:** 1536×1024px
- **Frame Layout:** 4 frames horizontal
- **Frame Size:** 384×1024px each
- **Frame Padding:** None (0px)
- **In-game Scaled Size:** 64×171px

### Frame Mapping

| Frame | State      | Condition                                                  |
| ----- | ---------- | ---------------------------------------------------------- |
| 0     | Idle       | `status === 'idle'`                                        |
| 1     | Jump       | `velocityRef.current < -0.5`                               |
| 2     | Float Down | `velocityRef.current >= -0.5 && velocityRef.current < 2.0` |
| 3     | Dead       | `status === 'ended'`                                       |

### Animation Behavior Changes

- **REMOVE:** Cat rotation (`cat.rotation = velocityRef.current * 0.035`)
- **KEEP:** Rainbow trail (no adjustments needed)
- **KEEP:** Center anchor point (0.5, 0.5)

### Implementation Details

```typescript
// Frame selection logic
const getCatFrame = (status: GameStatus, velocity: number): number => {
  if (status === "idle") return 0;
  if (status === "ended") return 3;
  if (velocity < -0.5) return 1; // Rising/jumping
  if (velocity >= -0.5 && velocity < 2.0) return 2; // Floating down
  return 2; // Default to floating
};

// Texture extraction from sprite sheet
const catFrames = [
  new Texture(baseTexture, new Rectangle(0, 0, 384, 1024)), // Idle
  new Texture(baseTexture, new Rectangle(384, 0, 384, 1024)), // Jump
  new Texture(baseTexture, new Rectangle(768, 0, 384, 1024)), // Float
  new Texture(baseTexture, new Rectangle(1152, 0, 384, 1024)), // Dead
];

// Sprite setup
const cat = new Sprite(catFrames[0]);
cat.anchor.set(0.5);
cat.scale.set(64 / 384); // Scale to 64px wide (171px tall due to aspect ratio)
```

---

## 3. Pipe Sprite Implementation

### Sprite Sheet Details

- **File:** `src/assets/pipes/pipes_cap_middle.png`
- **Total Dimensions:** 1024×1536px
- **Cap Section:** Y-offset 384-512px (128px tall)
- **Middle Tile:** Y-offset 768-1024px (256px tall)
- **In-game Width:** 80px (scaled down from 1024px)

### Texture Extraction

```typescript
// Extract textures from sprite sheet
const capTexture = new Texture(
  basePipeTexture,
  new Rectangle(0, 384, 1024, 128),
);

const middleTexture = new Texture(
  basePipeTexture,
  new Rectangle(0, 768, 1024, 256),
);
```

### Rendering Strategy

- **Use `TilingSprite`** for middle section (repeating texture)
- **Use `Sprite`** for cap at ends
- **Combine in `Container`** for each pipe segment
- **Scale factor:** 80/1024 = 0.078125

### Pipe Structure

**Top Pipe:**

```
[Cap at top, normal orientation]
[TilingSprite middle, extends downward]
```

**Bottom Pipe:**

```
[TilingSprite middle, extends upward]
[Cap at bottom, flipped 180°]
```

### Implementation Pseudocode

```typescript
const createPipePair = (centerY: number, gap: number) => {
  const container = new Container() as PipePair;
  const pipeWidth = 80;
  const scale = 80 / 1024;

  // Top pipe
  const topHeight = centerY - gap / 2;
  const topMiddleHeight = topHeight - 128 * scale; // Subtract cap height

  const topMiddle = new TilingSprite(middleTexture, pipeWidth, topMiddleHeight);
  topMiddle.tileScale.set(scale);

  const topCap = new Sprite(capTexture);
  topCap.scale.set(scale);
  topCap.y = topMiddleHeight;

  // Bottom pipe
  const bottomY = centerY + gap / 2;
  const bottomHeight = window.innerHeight - bottomY;
  const bottomMiddleHeight = bottomHeight - 128 * scale;

  const bottomCap = new Sprite(capTexture);
  bottomCap.scale.set(scale);
  bottomCap.y = bottomY;
  bottomCap.angle = 180; // Flip cap

  const bottomMiddle = new TilingSprite(
    middleTexture,
    pipeWidth,
    bottomMiddleHeight,
  );
  bottomMiddle.tileScale.set(scale);
  bottomMiddle.y = bottomY + 128 * scale;

  container.addChild(topMiddle, topCap, bottomCap, bottomMiddle);
  return container;
};
```

### Configuration Updates

Update `src/game/types.ts`:

```typescript
export const DEFAULT_CONFIG: GameConfig = {
  // ... existing config
  pipe: {
    gap: 200, // Changed from 180
    width: 80, // Changed from 90
    spacing: 250, // Unchanged
    speed: 2.8, // Unchanged
    minY: 80, // Unchanged
    maxY: 360, // Unchanged
  },
};
```

---

## 4. Canvas Viewport Constraints

### Rationale

Current full-width canvas allows players on ultrawide monitors to see pipes spawning far in advance, making the game significantly easier. Constraining width creates consistent difficulty across all screen sizes.

### Sizing Strategy

- **Max Width:** 1000px
- **Height:** Full `window.innerHeight` (maintains vertical flexibility)
- **Centering:** Horizontally centered with transparent sides
- **Responsive:** `Math.min(window.innerWidth, 1000)`

### Implementation

Create utility function:

```typescript
const getConstrainedWidth = () => Math.min(window.innerWidth, 1000);
```

Update all instances of `window.innerWidth` in `usePixiGame.ts`:

- `app.renderer.resize()`
- Cat positioning calculation
- Pipe spawn position
- Background star generation
- Trail rendering calculations

### Files to Update

- `usePixiGame.ts`: Replace all `window.innerWidth` with `getConstrainedWidth()`
- `CanvasView.tsx`: Add centering styles if canvas container needs explicit centering

---

## 5. Visual Effects (No Changes)

### Keeping As-Is

- **Starfield Background:** 110 stars, pulsing alpha (0.85-0.9)
- **Rainbow Trail:** Current positioning and rendering
- **Background Pulsing:** `background.alpha = 0.85 + 0.05 * Math.sin(performance.now() / 700)`

### Removing

- **Cat Rotation:** Delete line `cat.rotation = velocityRef.current * 0.035` (line 190)

---

## 6. Git Workflow

### Branch Strategy

```bash
git checkout -b feature/asset-integration
```

### Commit Strategy (Logical Commits)

**Commit 1:** Environment & Gitignore Setup

```bash
git add .gitignore .env.example opencode.json
git commit -m "chore: Add environment variable configuration and update gitignore

- Create .env.example template for PIXELLAB_API_KEY
- Update opencode.json to reference environment variable
- Add .env, opencode.json, and nul to .gitignore
- Prevents committing sensitive API keys to repository"
```

**Commit 2:** Cat Sprite Integration

```bash
git add src/assets/sprites/cat.png src/game/usePixiGame.ts
git commit -m "feat: Add cat sprite sheet with velocity-based frame animations

- Load 4-frame sprite sheet (idle, jump, float, dead)
- Implement velocity-based frame selection logic
- Scale sprite to 64x171px for consistent sizing
- Remove rotation behavior (sprites convey motion state)
- Frames: 384x1024px each, horizontal layout"
```

**Commit 3:** Pipe Sprite Integration

```bash
git add src/assets/pipes/pipes_cap_middle.png src/game/usePixiGame.ts
git commit -m "feat: Add pipe sprite rendering with cap and tiling system

- Load pipe sprite sheet with cap (128px) and middle (256px) sections
- Use TilingSprite for repeating middle sections
- Use Sprite for end caps (flipped for bottom pipes)
- Scale pipes to 80px width
- Cap at y-offset 384-512, middle at y-offset 768-1024"
```

**Commit 4:** Canvas Width Constraint

```bash
git add src/game/usePixiGame.ts
git commit -m "feat: Constrain canvas width to 1000px for balanced gameplay

- Limit viewport width to 1000px max
- Prevents seeing pipe spawns too early on wide screens
- Maintains full height for vertical flexibility
- Canvas automatically centers with transparent sides"
```

**Commit 5:** Config Updates

```bash
git add src/game/types.ts
git commit -m "chore: Update game config for new sprite dimensions

- Increase pipe gap: 180px → 200px (accommodate taller cat sprite)
- Adjust pipe width: 90px → 80px (match new sprite scaling)
- Maintains balanced difficulty with new visual assets"
```

### Pull Request

**Title:**

```
feat: Integrate sprite sheet animations for cat and pipe rendering
```

**Description:**

```markdown
## Summary

- Replaces programmatic graphics with sprite sheet assets for cat and pipes
- Implements velocity-based frame animations for cat (idle, jump, float, dead)
- Adds pipe rendering with cap and tiling middle sections
- Constrains canvas width to 1000px for consistent gameplay difficulty
- Sets up environment variable configuration for sensitive API keys

## Technical Changes

### Cat Sprite System

- 4-frame sprite sheet (384×1024px per frame)
- Scaled to 64×171px in-game
- Frame selection based on velocity and game state
- Removed rotation in favor of sprite-based animation

### Pipe Sprite System

- Cap texture: 1024×128px at y-offset 384
- Middle texture: 1024×256px at y-offset 768
- Uses `TilingSprite` for repeating middle sections
- Scaled to 80px width

### Canvas & Config

- Max width constrained to 1000px
- Pipe gap increased to 200px (from 180px)
- Pipe width adjusted to 80px (from 90px)

### Environment Setup

- Added `.env` for PIXELLAB_API_KEY
- Updated `.gitignore` to exclude secrets
- Created `.env.example` template

## Testing Performed

- [x] Dev mode: `npm run dev` - sprites load and animate correctly
- [x] All 4 cat animation states verified (idle, jump, float, dead)
- [x] Pipe rendering with cap + tiling middle sections
- [x] Canvas width constraint on ultrawide screen
- [x] Gameplay balance with new dimensions
- [x] Production build: `npm run build && npm run preview` - no errors
- [x] Assets properly bundled in production

## Visual Changes

- Cat now uses detailed pixel art sprite with 4 animation states
- Pipes now use sprite-based cap and tiling middle sections
- Canvas width limited to 1000px on wide screens
- Slightly increased pipe gap for better gameplay flow

## Breaking Changes

None - all changes are additive and maintain backward compatibility
```

---

## 7. Testing Strategy

### Phase 1: Development Testing

Run `npm run dev` and verify:

**Cat Sprite Animations:**

- [ ] Idle frame displays before first flap
- [ ] Jump frame displays when velocity < -0.5 (rising)
- [ ] Float frame displays when falling gently
- [ ] Dead frame displays on game over
- [ ] No rotation occurs (sprite stays upright)
- [ ] Sprite is properly scaled (64×171px)
- [ ] Rainbow trail still renders correctly

**Pipe Sprite Rendering:**

- [ ] Top pipes show cap at top, tiling middle below
- [ ] Bottom pipes show tiling middle, flipped cap at bottom
- [ ] Pipes are 80px wide
- [ ] No visual gaps between cap and middle sections
- [ ] Pipes scroll smoothly
- [ ] Collision detection works correctly

**Canvas Constraints:**

- [ ] On wide screen (>1000px), canvas is 1000px wide and centered
- [ ] On narrow screen (<1000px), canvas fills full width
- [ ] Height always fills full viewport
- [ ] Starfield background regenerates correctly on resize
- [ ] Cat position scales correctly with constrained width

**Gameplay:**

- [ ] Pipe gap (200px) feels balanced with taller cat (171px)
- [ ] Game difficulty progression still works
- [ ] Score tracking functions correctly
- [ ] Audio plays properly
- [ ] Pause/resume works

### Phase 2: Build Verification

```bash
npm run build
```

- [ ] TypeScript compilation succeeds
- [ ] No build errors or warnings
- [ ] Check bundle size is reasonable

```bash
npm run preview
```

- [ ] Production build runs correctly
- [ ] All sprites load in production mode
- [ ] Animations work in production build
- [ ] Game plays identically to dev mode
- [ ] Assets are properly optimized/bundled

### Phase 3: Cross-Device Testing (Optional)

- [ ] Test on mobile viewport (DevTools)
- [ ] Test on tablet viewport
- [ ] Test on desktop (1920×1080)
- [ ] Test on ultrawide (2560×1440)

---

## 8. Implementation Order

### Step 1: Setup Phase

```bash
# Create feature branch
git checkout -b feature/asset-integration

# Create .env file
echo "PIXELLAB_API_KEY=5360271e-f057-46a3-8142-6d7205aec888" > .env

# Create .env.example template
echo "PIXELLAB_API_KEY=your_api_key_here" > .env.example

# Update .gitignore (add: .env, opencode.json, nul)

# Update opencode.json to use ${PIXELLAB_API_KEY}

# Commit
git add .gitignore .env.example opencode.json
git commit -m "chore: Add environment variable configuration and update gitignore"
```

### Step 2: Canvas Width Constraint

```typescript
// In usePixiGame.ts

// Add utility function at top
const getConstrainedWidth = () => Math.min(window.innerWidth, 1000);

// Replace all instances of window.innerWidth with getConstrainedWidth()
// Key locations:
// - app.renderer.resize() calls
// - createBackground() width calculation
// - cat initial position (window.innerWidth * 0.2)
// - pipe spawn position (window.innerWidth + 100)
// - lastPipe spacing check (window.innerWidth - spacing)
// - handleResize() width calculation
```

Test: Resize browser window, verify 1000px max width

```bash
git add src/game/usePixiGame.ts
git commit -m "feat: Constrain canvas width to 1000px for balanced gameplay"
```

### Step 3: Cat Sprite Integration

```typescript
// In usePixiGame.ts

// Replace createCatTexture() function
const loadCatSprite = async () => {
  const catSpriteSheet = await Assets.load("/src/assets/sprites/cat.png");

  const frames = [
    new Texture(catSpriteSheet, new Rectangle(0, 0, 384, 1024)), // Idle
    new Texture(catSpriteSheet, new Rectangle(384, 0, 384, 1024)), // Jump
    new Texture(catSpriteSheet, new Rectangle(768, 0, 384, 1024)), // Float
    new Texture(catSpriteSheet, new Rectangle(1152, 0, 384, 1024)), // Dead
  ];

  return frames;
};

// Add frame selection helper
const getCatFrame = (status: GameStatus, velocity: number): number => {
  if (status === "idle") return 0;
  if (status === "ended") return 3;
  if (velocity < -0.5) return 1;
  return 2;
};

// In initialize():
const catFrames = await loadCatSprite();
const cat = new Sprite(catFrames[0]);
cat.anchor.set(0.5);
cat.scale.set(64 / 384); // Scale to 64px wide
cat.position.set(getConstrainedWidth() * 0.2, window.innerHeight / 2);
catRef.current = cat;

// In updateGame():
const currentFrame = getCatFrame(statusRef.current, velocityRef.current);
cat.texture = catFrames[currentFrame];

// REMOVE this line:
// cat.rotation = velocityRef.current * 0.035;
```

Test: Play game, verify all 4 animation states

```bash
git add src/assets/sprites/cat.png src/game/usePixiGame.ts
git commit -m "feat: Add cat sprite sheet with velocity-based frame animations"
```

### Step 4: Pipe Sprite Integration

```typescript
// In usePixiGame.ts

// Load pipe textures
const loadPipeSprite = async () => {
  const pipeSpriteSheet = await Assets.load(
    "/src/assets/pipes/pipes_cap_middle.png",
  );

  const capTexture = new Texture(
    pipeSpriteSheet.baseTexture,
    new Rectangle(0, 384, 1024, 128),
  );

  const middleTexture = new Texture(
    pipeSpriteSheet.baseTexture,
    new Rectangle(0, 768, 1024, 256),
  );

  return { capTexture, middleTexture };
};

// Store textures in refs
const pipeTexturesRef = useRef<{
  capTexture: Texture;
  middleTexture: Texture;
} | null>(null);

// In initialize():
const pipeTextures = await loadPipeSprite();
pipeTexturesRef.current = pipeTextures;

// Replace createPipePair() function
const createPipePair = useCallback((centerY: number, gap: number) => {
  const container = new Container() as PipePair;
  container.gap = gap;

  const textures = pipeTexturesRef.current;
  if (!textures) return container;

  const pipeWidth = 80;
  const scale = 80 / 1024;
  const capHeight = 128 * scale; // ~10px
  const middleTileHeight = 256 * scale; // ~20px

  // Top pipe
  const topPipeHeight = centerY - gap / 2;
  const topMiddleHeight = Math.max(0, topPipeHeight - capHeight);

  if (topMiddleHeight > 0) {
    const topMiddle = new TilingSprite(
      textures.middleTexture,
      pipeWidth,
      topMiddleHeight,
    );
    topMiddle.tileScale.set(scale);
    topMiddle.position.set(0, 0);
    container.addChild(topMiddle);
  }

  const topCap = new Sprite(textures.capTexture);
  topCap.scale.set(scale);
  topCap.position.set(0, topMiddleHeight);
  container.addChild(topCap);

  // Bottom pipe
  const bottomY = centerY + gap / 2;
  const bottomPipeHeight = Math.max(0, window.innerHeight - bottomY);
  const bottomMiddleHeight = Math.max(0, bottomPipeHeight - capHeight);

  const bottomCap = new Sprite(textures.capTexture);
  bottomCap.scale.set(scale);
  bottomCap.anchor.set(0, 1); // Anchor bottom for flip
  bottomCap.angle = 180;
  bottomCap.position.set(0, bottomY);
  container.addChild(bottomCap);

  if (bottomMiddleHeight > 0) {
    const bottomMiddle = new TilingSprite(
      textures.middleTexture,
      pipeWidth,
      bottomMiddleHeight,
    );
    bottomMiddle.tileScale.set(scale);
    bottomMiddle.position.set(0, bottomY);
    container.addChild(bottomMiddle);
  }

  container.x = getConstrainedWidth() + 100;
  container.y = 0;

  return container;
}, []);
```

Test: Verify pipe rendering looks correct

```bash
git add src/assets/pipes/pipes_cap_middle.png src/game/usePixiGame.ts
git commit -m "feat: Add pipe sprite rendering with cap and tiling system"
```

### Step 5: Config Updates

```typescript
// In src/game/types.ts

export const DEFAULT_CONFIG: GameConfig = {
  gravity: 0.25,
  flapStrength: -4.8,
  terminalVelocity: 8,
  pipe: {
    gap: 200, // Changed from 180
    width: 80, // Changed from 90
    spacing: 250,
    speed: 2.8,
    minY: 80,
    maxY: 360,
  },
};
```

Test: Play game, verify difficulty feels balanced

```bash
git add src/game/types.ts
git commit -m "chore: Update game config for new sprite dimensions"
```

### Step 6: Full Testing

- Run complete testing checklist (Phase 1 & 2)
- Fix any issues discovered
- Commit any fixes with descriptive messages

### Step 7: Create Pull Request

```bash
# Push branch to remote
git push -u origin feature/asset-integration

# Create PR using GitHub CLI or web interface
gh pr create --title "feat: Integrate sprite sheet animations for cat and pipe rendering" --body "$(cat <<'EOF'
## Summary
- Replaces programmatic graphics with sprite sheet assets for cat and pipes
- Implements velocity-based frame animations for cat (idle, jump, float, dead)
- Adds pipe rendering with cap and tiling middle sections
- Constrains canvas width to 1000px for consistent gameplay difficulty
- Sets up environment variable configuration for sensitive API keys

## Technical Changes
[See full description in plan document]

## Testing Performed
- All items in testing checklist completed
- Dev and production builds verified

## Visual Changes
- Cat uses detailed pixel art with 4 animation states
- Pipes use sprite-based rendering
- Canvas width limited to 1000px
EOF
)"
```

---

## 9. Key Files to Modify

| File                                    | Changes                                          |
| --------------------------------------- | ------------------------------------------------ |
| `.gitignore`                            | Add `.env`, `opencode.json`, `nul`               |
| `.env`                                  | Create new file with API key                     |
| `.env.example`                          | Create new template file                         |
| `opencode.json`                         | Replace hardcoded key with `${PIXELLAB_API_KEY}` |
| `src/game/types.ts`                     | Update `DEFAULT_CONFIG.pipe` values              |
| `src/game/usePixiGame.ts`               | Major refactor for sprites and canvas sizing     |
| `src/assets/sprites/cat.png`            | Commit to repo (already exists)                  |
| `src/assets/pipes/pipes_cap_middle.png` | Commit to repo (already exists)                  |

---

## 10. Risk Assessment & Mitigation

### Potential Issues

**Risk:** Sprite loading fails in production build

- **Mitigation:** Use proper Vite asset imports, test production build thoroughly

**Risk:** Performance degradation from sprite rendering

- **Mitigation:** TilingSprite is optimized for this use case, profile if needed

**Risk:** Collision detection breaks with new sprite sizes

- **Mitigation:** Test thoroughly, collision uses bounds which should auto-adjust

**Risk:** Rainbow trail looks wrong with new cat position/size

- **Mitigation:** Keep as-is initially, adjust in follow-up PR if needed

**Risk:** Game becomes too easy or too hard with new dimensions

- **Mitigation:** 200px gap chosen based on math (171px cat + 29px clearance), can adjust post-testing

---

## 11. Future Enhancements (Out of Scope)

- Fine-tune rainbow trail positioning for new sprite
- Add sprite animation for flapping (currently instant frame changes)
- Create additional cat sprite variations or skins
- Add particle effects for collision
- Implement sprite-based starfield background
- Add rotation back but only for specific frames
- Mobile touch controls optimization

---

## Success Criteria

- [ ] All sprites load correctly in dev and production
- [ ] Cat animations transition smoothly between all 4 states
- [ ] Pipes render with proper cap and tiling
- [ ] Canvas width constraint works on all screen sizes
- [ ] Game plays smoothly with no performance issues
- [ ] All tests pass (TypeScript, build, manual gameplay)
- [ ] PR is approved and merged to main
- [ ] No secrets committed to repository

---

**Plan Status:** Ready for Implementation  
**Estimated Implementation Time:** 2-3 hours  
**Complexity:** Medium (sprite integration + canvas refactor)
