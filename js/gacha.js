/* =====================================================================
   PULL LOGIC — rates, pity, and the limited 50/50. No DOM code here.
   ===================================================================== */
const Gacha = (() => {
  "use strict";

  const RARITIES = ["C", "R", "SR", "SSR"];
  const HIGH = new Set(["SR", "SSR"]);

  function activeBanner() {
    if (!ACTIVE_LIMITED_BANNER) return null;
    const banner = LIMITED_BANNERS[ACTIVE_LIMITED_BANNER];
    if (!banner) console.warn(`ACTIVE_LIMITED_BANNER "${ACTIVE_LIMITED_BANNER}" is not a key in LIMITED_BANNERS.`);
    return banner || null;
  }

  function weighted(weights, rng) {
    const entries = Object.entries(weights).filter(([, w]) => w > 0);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = rng() * total;
    for (const [key, w] of entries) {
      if ((roll -= w) < 0) return key;
    }
    return entries[entries.length - 1][0];
  }

  const pickOne = (arr, rng) => arr[Math.floor(rng() * arr.length)];

  // If nothing exists at the rolled rarity, use the nearest rarity that has items.
  function nearestStocked(rarity, hasItems) {
    if (hasItems(rarity)) return rarity;
    const i = RARITIES.indexOf(rarity);
    for (let d = 1; d < RARITIES.length; d++) {
      for (const j of [i - d, i + d]) {
        if (RARITIES[j] && hasItems(RARITIES[j])) return RARITIES[j];
      }
    }
    return null;
  }

  /**
   * One pull. `state` is { pity, guaranteed }:
   *   pity       — pulls since the last guaranteed pull
   *   guaranteed — true after losing a 50/50; next contested pull is limited
   * `forced` (optional) skips the rarity roll. `forcedItemId` (optional) skips the
   * roll entirely and gives that item. Either way, forcing C or R on a pity pull
   * doesn't use up the pity; the next pull is still guaranteed.
   * Returns the item plus the next { pity, guaranteed }. Does not mutate input.
   */
  function pull(state, rng = Math.random, forced = null, forcedItemId = null) {
    const cfg = GACHA_CONFIG;
    const banner = activeBanner();
    // `pullable: false` items (e.g. upgrade tiers) exist but never drop.
    const inPool = r => item => item.rarity === r && item.pullable !== false;
    const std = r => STANDARD_ITEMS.filter(inPool(r));
    const lim = r => (banner ? banner.items : []).filter(inPool(r));

    const forcedEntry = forcedItemId ? allItems().find(e => e.item.id === forcedItemId) : null;
    const forcedRarity = forcedEntry ? forcedEntry.item.rarity : forced;
    const pityDue = state.pity + 1 >= cfg.pityEvery;
    const isPity = pityDue && !(forcedRarity && !HIGH.has(forcedRarity));
    const rolled = forcedRarity || weighted(isPity ? cfg.pityRates : cfg.rates, rng);
    const rarity = forcedEntry ? rolled : nearestStocked(rolled, r => std(r).length + lim(r).length > 0);
    if (!rarity) throw new Error("The item pool is empty. Add items to js/items.js.");

    let guaranteed = state.guaranteed;
    let item, limited, outcome = null;

    const contested = HIGH.has(rarity)
      && (isPity || cfg.fiftyFiftyOnEveryHighPull)
      && lim(rarity).length > 0
      && std(rarity).length > 0;

    if (forcedEntry) {
      // A chosen item counts toward the 50/50 the same way it would if it dropped naturally.
      item = forcedEntry.item;
      limited = forcedEntry.bannerKey !== null;
      if (contested && limited) {
        outcome = guaranteed ? "guaranteed" : "won"; guaranteed = false;
      } else if (contested && !guaranteed) {
        outcome = "lost"; guaranteed = true;
      }
      // A standard item while the guarantee is owed leaves the guarantee in place.
    } else if (contested) {
      if (guaranteed) {
        limited = true; outcome = "guaranteed"; guaranteed = false;
      } else if (rng() < cfg.limitedChance) {
        limited = true; outcome = "won";
      } else {
        limited = false; outcome = "lost"; guaranteed = true;
      }
      item = pickOne(limited ? lim(rarity) : std(rarity), rng);
    } else {
      const pool = [...std(rarity).map(i => [i, false]), ...lim(rarity).map(i => [i, true])];
      [item, limited] = pickOne(pool, rng);
    }

    const resetPity = isPity || (cfg.pityResetsOn || []).includes(rarity);
    const nextPity = resetPity ? 0 : pityDue ? state.pity : state.pity + 1;
    return {
      item, rarity, limited, isPity, outcome,
      bannerKey: forcedEntry ? forcedEntry.bannerKey : limited ? ACTIVE_LIMITED_BANNER : null,
      state: { pity: nextPity, guaranteed },
    };
  }

  function allItems() {
    const out = STANDARD_ITEMS.map(item => ({ item, bannerKey: null }));
    for (const [key, banner] of Object.entries(LIMITED_BANNERS)) {
      for (const item of banner.items) out.push({ item, bannerKey: key });
    }
    return out;
  }

  function findItem(id) {
    const hit = allItems().find(entry => entry.item.id === id);
    return hit ? hit.item : null;
  }

  function validate() {
    const problems = [];
    const seen = new Set();
    for (const { item } of allItems()) {
      if (!item.id) problems.push(`An item named "${item.name}" has no id.`);
      else if (seen.has(item.id)) problems.push(`Duplicate item id "${item.id}".`);
      seen.add(item.id);
      if (!RARITIES.includes(item.rarity)) problems.push(`"${item.id}" has unknown rarity "${item.rarity}".`);
    }
    for (const { item } of allItems()) {
      if (item.upgradesTo && !seen.has(item.upgradesTo)) problems.push(`"${item.id}" upgrades to "${item.upgradesTo}", which doesn't exist.`);
      if (typeof item.sound === "string" && item.sound.endsWith("/")) {
        const folder = item.sound.replace(/\/+$/, "").split("/").pop();
        const clips = typeof SOUND_FOLDERS === "object" ? SOUND_FOLDERS[folder] : null;
        if (!clips || !clips.length) problems.push(`"${item.id}" plays sound folder "${folder}", but js/sounds.js has no clips listed for it.`);
      }
    }
    if (ACTIVE_LIMITED_BANNER && !LIMITED_BANNERS[ACTIVE_LIMITED_BANNER]) {
      problems.push(`ACTIVE_LIMITED_BANNER "${ACTIVE_LIMITED_BANNER}" doesn't exist.`);
    }
    return problems;
  }

  return { RARITIES, activeBanner, pull, allItems, findItem, validate };
})();
