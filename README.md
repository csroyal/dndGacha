# Multiverse Armory

A gacha pull tracker for a D&D character who pulls weapons from across the multiverse.

**To run:** double-click `index.html`. No install or server needed. Your pulls, inventory and pity
are saved in the browser, so use the same browser each session.

## Editing items — `js/items.js`

Everything you'll want to change is in this one file.

- **Add an item:** copy an existing entry into `STANDARD_ITEMS` (always in the pool) or into a
  rotation inside `LIMITED_BANNERS`. Give it a unique `id` and don't change the id later, since
  pull history refers to it.
- **Images:** put files in `images/items/` and set `image: "images/items/your-file.png"`.
  Transparent PNGs look best. Leave `image: ""` to show the emoji `icon` instead.
- **Sounds:** put a clip in `sounds/` and set `sound: "sounds/your-clip.mp3"`, with
  `soundVolume` (0 to 1) to tune it. For a random clip on each pull, make a folder such as
  `sounds/jarona/`, set `sound: "sounds/jarona/"`, and list its clips in `js/sounds.js`
  (each with its own volume).
- **Stats:** `stats` takes any label/value pairs, such as `{ Damage: "2d8", "Save DC": "15" }`.
- **Text:** `description` is what the item does in play. `flavor` is optional italic lore shown
  below it. Use `\n` for a line break in either.
- **How long it's held:** `duration: 1` means this turn only, `3` means three turns, and
  `"permanent"` means it's kept for the rest of the encounter.
- **Switch the limited rotation:** change `ACTIVE_LIMITED_BANNER` at the top of the file to another
  key in `LIMITED_BANNERS`, or set it to `null` for standard items only.
- **Rates and pity:** these are in `GACHA_CONFIG`, which also has two switches for rules that can
  go either way:
  - `pityResetsOn`: which rarities reset the 3-pull pity count when pulled early (default: `["SSR"]`).
  - `fiftyFiftyOnEveryHighPull`: whether a natural SR/SSR also uses the 50/50 (default: no, only pity pulls do).

To check how a new image looks, open `index.html?preview=<item-id>`, or click any item under the
ⓘ button and choose **Replay reveal**. Neither one changes your save.

## Using it at the table

| Button | What it does |
| --- | --- |
| **Open the Portal** | Starts the next turn and pulls. Single-turn items from last turn expire. |
| Extra pull (same turn) | Pulls without advancing the turn. |
| Pass turn | Advances the turn without pulling. |
| End encounter | Resets everything for the next fight: turn counter, pity count, 50/50 guarantee, and the whole inventory (∞ items too). History is kept. Undo can bring it back. |
| Undo | Reverts the last pull, pass, or encounter end. |

Inventory cards have − / + to adjust turns, ∞ to keep an item for the rest of the encounter, and ✕ to
discard it. You can add any past pull back to your inventory with **+ Keep** in History.

## Checking the math

Open `tests/simulate.html`. It runs 300,000 pulls with your current config and checks the rates,
the every-3rd-pull pity, and the 50/50 guarantee.
