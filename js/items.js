/* =====================================================================
   MULTIVERSE ARMORY — ITEM DATA & BANNER CONFIG
   This is the only file you need to edit to add items or change the
   active limited rotation.
   ===================================================================== */

/* Which limited rotation is in the pool right now.
   Must match a key in LIMITED_BANNERS below, or null for standard items only. */
const ACTIVE_LIMITED_BANNER = "fnaf";

const GACHA_CONFIG = {
  // Base rates (percent) for a normal pull.
  rates: { C: 50, R: 30, SR: 15, SSR: 5 },

  // Every Nth pull is guaranteed SR or SSR.
  pityEvery: 3,

  // Odds on a guaranteed pity pull (relative weights: 2:1 = 2/3 SR, 1/3 SSR).
  pityRates: { SR: 2, SSR: 1 },

  // Chance a pity pull lands on a limited item (the "50/50").
  limitedChance: 0.5,

  // Pulling one of these rarities before pity resets the pity counter.
  // ["SSR"] = an early SSR resets it; ["SR", "SSR"] = any early SR+ does; [] = never.
  pityResetsOn: ["SSR"],

  // false = the 50/50 only applies on pity pulls; a natural SR/SSR is picked from
  //         the whole pool (standard + limited) and doesn't touch the guarantee.
  // true  = every SR/SSR pull uses the 50/50 + guarantee rules.
  fiftyFiftyOnEveryHighPull: false,

  // Rate-up for the active rotation's limited items, outside of the 50/50.
  // { R: 0.5 } = half of all Rare pulls give the limited R (split evenly if there are
  // several). Rarities not listed pick evenly across standard + limited items.
  limitedRateUp: { R: 0.33 },
};

/* ---------------------------------------------------------------------
   PROPERTY DEFINITIONS
   Shown when you hover a word in an item's "Properties" stat. Matching ignores
   case and anything in parentheses, so "Versatile (1d10)" uses "Versatile".
   Add your own terms for custom items the same way.
   --------------------------------------------------------------------- */
const PROPERTY_GLOSSARY = {
  "Ammunition": "You need ammunition to make a ranged attack with this weapon, and each attack uses one piece. Drawing it is part of the attack. After a fight, you can spend a minute to recover half your spent ammunition.",
  "Finesse": "When attacking with this weapon, you choose whether to use your Strength or Dexterity modifier for the attack and damage rolls. You must use the same modifier for both.",
  "Heavy": "Small creatures have disadvantage on attack rolls with this weapon. Its size and bulk make it too large for a Small creature to use effectively.",
  "Light": "A small, easy-to-handle weapon, ideal for fighting with two weapons. When you attack with a light melee weapon in one hand, you can use a bonus action to attack with a different light melee weapon in the other.",
  "Loading": "Because of the time needed to load this weapon, you can fire only one piece of ammunition from it when you use an action, bonus action, or reaction to fire it, no matter how many attacks you can normally make.",
  "Reload": "This weapon can fire the number of shots in parentheses before it must be reloaded. Reloading takes an action or a bonus action (your choice).",
  "Sap": "If you hit a creature with this weapon, that creature has disadvantage on its next attack roll before the start of your next turn.",
  "Reach": "This weapon adds 5 feet to your reach when you attack with it, and when determining your reach for opportunity attacks with it.",
  "Special": "This weapon has unusual rules for its use, explained in its description.",
  "Thrown": "You can throw this weapon to make a ranged attack, using the same ability modifier you'd use for a melee attack with it. The numbers are its normal and long range.",
  "Two-handed": "This weapon requires two hands when you attack with it.",
  "Versatile": "This weapon can be used with one or two hands. The damage in parentheses is used when you attack with two hands.",
};

/* ---------------------------------------------------------------------
   SPELL DEFINITIONS
   Any of these names written in an item's description or stats becomes
   hoverable and shows the spell text. Matching is case-sensitive, so write
   spell names capitalized the way they appear here (e.g. "Fireball").

   The hover shows the spell at the level written next to it, so "Fireball
   at 5th level", "Fireball (5th level)" and "5th-level Fireball" all show
   the 5th-level version. Write scaling numbers in text as [base +perLevel]:
   "[8d6 +1d6]" is 8d6 at the spell's own level, plus 1d6 per level above it.
   level: 0 means a cantrip.
   --------------------------------------------------------------------- */
const SPELL_GLOSSARY = {
  "Fireball": {
    level: 3, school: "evocation", castingTime: "Action", range: "150 ft", duration: "Instantaneous",
    text: "A bright streak flashes from you to a point you choose within range, then blossoms into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point makes a Dexterity saving throw, taking [8d6 +1d6] fire damage on a failed save or half as much on a successful one. Flammable objects in the area that aren't being worn or carried start burning.",
    higher: "The damage increases by 1d6 for each slot level above 3rd.",
  },
};

/* ---------------------------------------------------------------------
   CONDITION DEFINITIONS
   Shown when you hover a condition in an item's description or stats.
   Matching is case-sensitive, so capitalize them as D&D does
   ("the Stunned condition").
   --------------------------------------------------------------------- */
const CONDITION_GLOSSARY = {
  "Blinded": "You can't see and automatically fail any ability check that requires sight. Attack rolls against you have advantage, and your attack rolls have disadvantage.",
  "Charmed": "You can't attack the charmer or target it with damaging abilities or magical effects. The charmer has advantage on any ability check to interact with you socially.",
  "Deafened": "You can't hear and automatically fail any ability check that requires hearing.",
  "Frightened": "You have disadvantage on ability checks and attack rolls while the source of your fear is within line of sight. You can't willingly move closer to the source of your fear.",
  "Grappled": "Your speed is 0 and can't increase. You have disadvantage on attack rolls against any target other than the grappler. The grappler can drag or carry you, but it moves at half speed while doing so.",
  "Incapacitated": "You can't take actions, bonus actions or reactions. Your concentration is broken, you can't speak, and you have disadvantage on initiative rolls.",
  "Invisible": "You can't be seen without magic or a special sense. You have advantage on initiative rolls, attack rolls against you have disadvantage, and your attack rolls have advantage, unless a creature can somehow see you.",
  "Paralyzed": "You have the Incapacitated condition, your speed is 0, and you automatically fail Strength and Dexterity saving throws. Attack rolls against you have advantage, and any hit from within 5 feet is a critical hit.",
  "Petrified": "You turn to stone along with nonmagical objects you're wearing or carrying. You have the Incapacitated condition, your speed is 0, and attack rolls against you have advantage. You automatically fail Strength and Dexterity saving throws, have resistance to all damage, and have immunity to the Poisoned condition.",
  "Poisoned": "You have disadvantage on attack rolls and ability checks.",
  "Prone": "Your only movement option is to crawl, unless you stand up, which costs half your speed. You have disadvantage on attack rolls. Attack rolls against you have advantage if the attacker is within 5 feet of you, and disadvantage otherwise.",
  "Restrained": "Your speed is 0 and can't increase. Attack rolls against you have advantage, and your attack rolls have disadvantage. You have disadvantage on Dexterity saving throws.",
  "Stunned": "You have the Incapacitated condition and automatically fail Strength and Dexterity saving throws. Attack rolls against you have advantage.",
  "Unconscious": "You have the Incapacitated and Prone conditions, drop whatever you're holding, and are unaware of your surroundings. Your speed is 0, you automatically fail Strength and Dexterity saving throws, and attack rolls against you have advantage. Any hit from within 5 feet is a critical hit.",
};

/* ---------------------------------------------------------------------
   ITEM FORMAT  (copy this template to add a new item)

   {
     id:          "master-sword",        // unique, lowercase; never change once used
     name:        "The Master Sword",
     rarity:      "SSR",                 // "C" | "R" | "SR" | "SSR"
     type:        "Weapon",              // free text: Weapon, Shield, Consumable...
     origin:      "The Legend of Zelda", // shown as "from ..."
     image:       "images/items/master-sword.png",  // "" = show the icon instead
     icon:        "🗡️",                  // placeholder when there's no image
     duration:    1,                     // 1 = this turn only, 3 = three turns,
                                         // "permanent" = until discarded
     stats:       { Damage: "2d8 slashing", Range: "Melee" },   // any label/value pairs
     description: "What it does in play. Use \n for a line break.",
     flavor:      "Italic flavor text shown under the description.",
     sound:       "sounds/master-sword.mp3",   // optional: plays on reveal along with the
                                               // built-in sound (any rarity; mp3/ogg/wav).
                                               // A folder like "sounds/jarona/" plays a random
                                               // clip from it; list its clips in js/sounds.js.
     soundVolume: 0.8,                         // optional: 0 to 1 (default 1) for that sound.
                                               // Browsers can't play a file louder than it is,
                                               // so a sound that's too quiet at 1 needs a
                                               // louder copy of the file. For a folder, this
                                               // multiplies each clip's volume in js/sounds.js
                                               // and can go above 1 (e.g. 2 = twice as loud),
                                               // up to each clip's full volume.
   }

   Every field except id, name and rarity is optional.
   --------------------------------------------------------------------- */

const STANDARD_ITEMS = [
  // ---------------- C ----------------
  // Standard D&D weapons (Player's Handbook stats). No origin or flavor, so those lines
  // don't show. Each one already points at images/items/<id>.png: drop a file with that
  // name in the folder and it appears. Until then, the icon is shown.
  {
    id: "club", name: "Club", rarity: "C", type: "Simple Melee Weapon",
    image: "images/items/club.png", icon: "🪵", duration: 1,
    stats: { Damage: "1d4 bludgeoning", Range: "Melee", Properties: "Light" },
  },
  {
    id: "dagger", name: "Dagger", rarity: "C", type: "Simple Melee Weapon",
    image: "images/items/dagger.png", icon: "🗡️", duration: 1,
    stats: { Damage: "1d4 piercing", Range: "Melee / Thrown 20/60 ft", Properties: "Finesse, Light, Thrown" },
  },
  {
    id: "greatclub", name: "Greatclub", rarity: "C", type: "Simple Melee Weapon",
    image: "images/items/greatclub.png", icon: "🪵", duration: 1,
    stats: { Damage: "1d8 bludgeoning", Range: "Melee", Properties: "Two-handed" },
  },
  {
    id: "quarterstaff", name: "Quarterstaff", rarity: "C", type: "Simple Melee Weapon",
    image: "images/items/quarterstaff.png", icon: "🦯", duration: 1,
    stats: { Damage: "1d6 bludgeoning", Range: "Melee", Properties: "Versatile (1d8)" },
  },
  {
    id: "crossbow", name: "Crossbow", rarity: "C", type: "Simple Ranged Weapon",   // light crossbow
    image: "images/items/crossbow.png", icon: "🏹", duration: 1,
    stats: { Damage: "1d8 piercing", Range: "80/320 ft", Properties: "Ammunition, Loading, Two-handed" },
  },
  {
    id: "axe", name: "Axe", rarity: "C", type: "Martial Melee Weapon",              // battleaxe
    image: "images/items/axe.png", icon: "🪓", duration: 1,
    stats: { Damage: "1d8 slashing", Range: "Melee", Properties: "Versatile (1d10)" },
  },
  {
    id: "hammer", name: "Hammer", rarity: "C", type: "Martial Melee Weapon",        // warhammer
    image: "images/items/hammer.png", icon: "🔨", duration: 1,
    stats: { Damage: "1d8 bludgeoning", Range: "Melee", Properties: "Versatile (1d10)" },
  },
  {
    id: "glaive", name: "Glaive", rarity: "C", type: "Martial Melee Weapon",
    image: "images/items/glaive.png", icon: "🔱", duration: 1,
    stats: { Damage: "1d10 slashing", Range: "Melee (reach 10 ft)", Properties: "Heavy, Reach, Two-handed" },
  },
  {
    id: "greatsword", name: "Greatsword", rarity: "C", type: "Martial Melee Weapon",
    image: "images/items/greatsword.png", icon: "⚔️", duration: 1,
    stats: { Damage: "2d6 slashing", Range: "Melee", Properties: "Heavy, Two-handed" },
  },
  {
    id: "greataxe", name: "Greataxe", rarity: "C", type: "Martial Melee Weapon",
    image: "images/items/greataxe.png", icon: "🪓", duration: 1,
    stats: { Damage: "1d12 slashing", Range: "Melee", Properties: "Heavy, Two-handed" },
  },
  {
    id: "halberd", name: "Halberd", rarity: "C", type: "Martial Melee Weapon",
    image: "images/items/halberd.png", icon: "🔱", duration: 1,
    stats: { Damage: "1d10 slashing", Range: "Melee (reach 10 ft)", Properties: "Heavy, Reach, Two-handed" },
  },
  {
    id: "lance", name: "Lance", rarity: "C", type: "Martial Melee Weapon",
    image: "images/items/lance.png", icon: "🔱", duration: 1,
    stats: { Damage: "1d12 piercing", Range: "Melee (reach 10 ft)", Properties: "Reach, Special" },
    description: "You have disadvantage when you use a lance to attack a target within 5 feet of you. A lance requires two hands to wield when you aren't mounted.",
  },
  {
    id: "shortsword", name: "Shortsword", rarity: "C", type: "Martial Melee Weapon",
    image: "images/items/shortsword.png", icon: "🗡️", duration: 1,
    stats: { Damage: "1d6 piercing", Range: "Melee", Properties: "Finesse, Light" },
  },
  {
    id: "morningstar", name: "Morningstar", rarity: "C", type: "Martial Melee Weapon",
    image: "images/items/morningstar.png", icon: "⚙️", duration: 1,
    stats: { Damage: "1d8 piercing", Range: "Melee" },
  },
  {
    id: "longbow", name: "Longbow", rarity: "C", type: "Martial Ranged Weapon",
    image: "images/items/longbow.png", icon: "🏹", duration: 1,
    stats: { Damage: "1d8 piercing", Range: "150/600 ft", Properties: "Ammunition, Heavy, Two-handed" },
  },
  {
    id: "whip", name: "Whip", rarity: "C", type: "Martial Melee Weapon",
    image: "images/items/whip.png", icon: "➰", duration: 1,
    stats: { Damage: "1d4 slashing", Range: "Melee (reach 10 ft)", Properties: "Finesse, Reach" },
  },
  {
    id: "rapier", name: "Rapier", rarity: "C", type: "Martial Melee Weapon",
    image: "images/items/rapier.png", icon: "🤺", duration: 1,
    stats: { Damage: "1d8 piercing", Range: "Melee", Properties: "Finesse" },
  },

  // ---------------- R ----------------
  // R = a C-level weapon (Player's Handbook damage dice, no flat bonuses) plus one
  // enhanced effect. Save DCs use the usual formula: 8 + proficiency bonus (PB) + modifier.
  {
    id: "b-dasher", name: "B-Dasher", rarity: "R", type: "Wondrous Item", origin: "Mario Kart",
    image: "images/items/b-dasher.png", icon: "🏎️", duration: 1,
    sound: "sounds/b-dasher.mp3", soundVolume: 0.1,
    stats: { Speed: "+30 ft", Shield: "Absorbs 1 hit" },
    description: "While you ride this kart, your speed increases by 30 feet. The first time you would take damage before the start of your next turn, the kart takes it instead, and you take none.",
    flavor: "I'm Using Tilt Controls!",
  },
  {
    id: "ragnell", name: "Ragnell", rarity: "R", type: "Weapon", origin: "Fire Emblem",
    image: "images/items/ragnell.png", icon: "✨", duration: 1,
    sound: "sounds/ragnell/",
    stats: { Damage: "2d6 slashing", Range: "Melee", Properties: "Heavy, Two-handed" },
    description: "You may choose to hold your action for this turn. If you do and are attacked during the next enemy phase, you can use your reaction to make one attack against that creature with this weapon. On a hit, the attack deals double damage.",
    flavor: "I fight for my friends.",
  },
  {
    id: "big-earner", name: "Big Earner", rarity: "R", type: "Weapon", origin: "Team Fortress 2",
    image: "images/items/big-earner.png", icon: "🦇", duration: 1,
    sound: "sounds/big-earner.mp3", soundVolume: 0.1,
    stats: { Damage: "1d4 piercing", Range: "Melee / Thrown 20/60 ft", Properties: "Finesse, Light, Thrown" },
    description: "Backstab. When you hit a creature that couldn't see you with this weapon, for example because you were hidden or invisible, your speed increases by 100 feet until the end of your turn.",
    flavor: "Now I know ya lookin' at this switch and ya think ya just gettin' gipped for something dinky and broken. Well, you'd be right.",
  },
  {
    id: "peacekeeper", name: "Peacekeeper", rarity: "R", type: "Weapon", origin: "Overwatch",
    image: "images/items/peacekeeper.png", icon: "", duration: 1,
    sound: "sounds/peacekeeper/",
    stats: { Damage: "1d8 piercing", Range: "40/120 ft", Properties: "Ammunition, Reload (6 shots), Sap" },
    description: "Fan the Hammer. As an action, you can make six ranged attacks with this weapon against one or more targets. Don't add your ability modifier or proficiency bonus to these attack rolls, and don't add your ability modifier to their damage.",
    flavor: "It's high noon...",
  },
  {
    id: "spookysword", name: "Spookysword", rarity: "R", type: "Weapon", origin: "Deltarune",
    image: "images/items/spookysword.png", icon: "🗡️", duration: 1,
    sound: "sounds/spookysword/",
    stats: { Damage: "1d6 slashing", Range: "Melee", Properties: "Finesse, Light", Save: "Constitution, DC 8 + PB + STR or DEX" },
    description: "When you hit a creature with this weapon, it must succeed on a Constitution saving throw or have the Blinded condition until the start of your next turn.",
    flavor: "(It's kinda cool...)",
  },
  {
    id: "sting", name: "Sting", rarity: "R", type: "Weapon", origin: "The Lord of the Rings",
    image: "images/items/sting.png", icon: "🗡️", duration: 1,
    sound: "sounds/sting.mp3", soundVolume: 0.1,
    stats: { Damage: "1d6+1 piercing", Range: "Melee", Properties: "Finesse, Light" },
    description: "When a creature within your reach targets you with an attack or spell, you can use your reaction to make an opportunity attack against that creature with this weapon.",
    flavor: "An elven blade, small enough for a hobbit.",
  },
  {
    id: "batarang", name: "Batarang", rarity: "R", type: "Weapon", origin: "Batman",
    image: "images/items/batarang.png", icon: "🦇", duration: 1,
    sound: "sounds/batarang.mp3", soundVolume: 0.15,
    stats: { Damage: "1d4 slashing", Range: "Thrown 30/90 ft", Properties: "Finesse, Thrown" },
    description: "When you throw this weapon, you can target a willing ally instead of an enemy. You don't make an attack roll, and the ally takes no damage. Instead, you move the ally up to 30 feet in a direction you choose.",
    flavor: "You either die a hero or live long enough to see yourself become the villain.",
  },
  {
    id: "captain-shield", name: "Captain's Shield", rarity: "R", type: "Shield", origin: "Captain America",
    image: "images/items/captain-shield.png", icon: "🛡️", duration: 1,
    sound: "sounds/captain-shield.mp3", soundVolume: 0.6,
    stats: { AC: "+2", "Unarmed Strike": "1d4 bludgeoning", Save: "Constitution, DC 8 + PB + STR" },
    description: "Your unarmed strikes deal 1d4 bludgeoning damage. When you hit a creature with an unarmed strike, it must succeed on a Constitution saving throw or have the Stunned condition until the start of your next turn.",
    flavor: "I can do this all day.",
  },
  {
    id: "repulsor", name: "Repulsor", rarity: "R", type: "Weapon", origin: "Iron Man",
    image: "images/items/repulsor.png", icon: "✋", duration: 1,
    sound: "sounds/repulsor.mp3", soundVolume: 0.4,
    stats: { Damage: "1d8 force", Range: "150/600 ft", Area: "100-ft cone (blast)", Save: "Dexterity, DC 8 + PB + DEX" },
    description: "You can make ranged attacks with this gauntlet as if it were a longbow, dealing force damage.\nBlast. As an action, you can fire a 100-foot cone instead. Each creature in the cone makes a Dexterity saving throw, taking 1d8 + your Dexterity modifier force damage on a failed save, or half as much on a successful one.",
    flavor: "I... am... Iron Man...",
  },
  {
    id: "hulk-fist", name: "Hulk Fist", rarity: "R", type: "Weapon", origin: "The Incredible Hulk",
    image: "images/items/hulk-fist.png", icon: "👊", duration: 1,
    sound: "sounds/hulk-fist.mp3", soundVolume: 0.38,
    stats: { Damage: "2d6 bludgeoning", Range: "Melee", Area: "20-ft radius (slam)", Save: "Dexterity, DC 8 + PB + STR" },
    description: "Slam. As an action, you can smash the ground. Each creature of your choice within 20 feet of you makes a Dexterity saving throw, taking 2d6 + your Strength modifier bludgeoning damage on a failed save, or half as much on a successful one.",
    flavor: "HULK SMASH!!!",
  },
  {
    id: "lightsaber", name: "Lightsaber", rarity: "R", type: "Weapon", origin: "Star Wars",
    image: "images/items/lightsaber.png", icon: "✨", duration: 1,
    sound: "sounds/lightsaber.mp3", soundVolume: 0.1,
    stats: { Damage: "1d8 radiant", Range: "Melee", Properties: "Finesse" },
    description: "Your attacks with this weapon automatically hit. Roll anyway, since a 20 is still a critical hit.\nWhen you attack with this weapon, you can also choose one creature you can see within 30 feet of you and push it up to 30 feet away from you or pull it up to 30 feet toward you.",
    flavor: "An elegant weapon for a more civilized age.",
  },

  // ---------------- SR ----------------
  // SR = the base weapon's dice + 1d4 bonus damage (a one-handed hit averages ~7 vs ~4.5 for C/R).
  // Versatile only changes the base die. Save DCs: 8 + PB + modifier.
  {
    id: "fire-flower", name: "Fire Flower", rarity: "SR", type: "Wondrous Item", origin: "Super Mario",
    image: "images/items/fire-flower.png", icon: "🔥", duration: 1,
    sound: "sounds/fire-flower.mp3", soundVolume: 0.25,
    stats: { Spell: "Fireball (3rd level)", Damage: "8d6 fire", Range: "150 ft", Area: "20-ft-radius sphere", Save: "Dexterity, DC 8 + PB + DEX" },
    description: "As an action, you can cast Fireball at 3rd level from this item. You don't need a spell slot or components.",
    flavor: "It looks like a flower with a face!",
  },
  {
    id: "hylian-shield", name: "Hylian Shield", rarity: "SR", type: "Shield", origin: "The Legend of Zelda",
    image: "images/items/hylian-shield.png", icon: "🛡️", duration: 1,
    sound: "sounds/hylian-shield.mp3", soundVolume: 0.9,
    stats: { AC: "+2", Rebound: "Enemies within 10 ft" },
    description: "When a creature hits you with an attack while you're holding this shield, you take no damage from that attack. Instead, an enemy within 10 feet of you takes that damage.",
    flavor: "It's dangerous to go alone! Take this.",
  },
  {
    id: "falchion", name: "Falchion", rarity: "SR", type: "Weapon", origin: "Fire Emblem",
    image: "images/items/falchion.png", icon: "⚔️", duration: 1,
    sound: "sounds/falchion/",
    stats: { Damage: "1d8 slashing + 1d4 radiant", Range: "Melee", Properties: "Versatile (1d10)" },
    description: "Each time you make an attack with this weapon this turn, each of your allies can immediately make one attack as well. This doesn't require an action.",
    flavor: "I am a prince before I am a son or brother.",
  },
  // Stone Sword upgrades by swapping to the next tier's item (see `upgradesTo`).
  // `upgradeSound` plays when that tier upgrades (volume 0 to 1 in `upgradeSoundVolume`).
  // Iron and Diamond have `pullable: false`, so they only come from upgrading.
  {
    id: "minecraft-sword", name: "Stone Sword", rarity: "SR", type: "Weapon", origin: "Minecraft",
    image: "images/items/stone-sword.png", icon: "🗡️", duration: "permanent", upgradesTo: "iron-sword",
    sound: "sounds/stone-sword.mp3", soundVolume: 0.1,
    upgradeSound: "sounds/minecraft-upgrade.mp3", upgradeSoundVolume: 1,
    stats: { Damage: "1d8 slashing", Range: "Melee", Upgrades: "Iron 2d6 → Diamond 2d8" },
    description: "You keep this sword for the rest of the encounter.\nUpgrade. Instead of pulling on one of your turns, you can upgrade this sword to the next tier: Stone → Iron → Diamond.",
    flavor: "First, we mine. Then, we craft. Let's Minecraft!",
  },
  {
    id: "iron-sword", name: "Iron Sword", rarity: "SR", type: "Weapon", origin: "Minecraft", pullable: false,
    image: "images/items/iron-sword.png", icon: "🗡️", duration: "permanent", upgradesTo: "diamond-sword",
    upgradeSound: "sounds/minecraft-upgrade.mp3", upgradeSoundVolume: 1,
    stats: { Damage: "2d6 slashing", Range: "Melee", Upgrades: "Diamond 2d8" },
    description: "You keep this sword for the rest of the encounter.\nUpgrade. Instead of pulling on one of your turns, you can upgrade this sword to Diamond.",
    flavor: "First, we mine. Then, we craft. Let's Minecraft!",
  },
  {
    id: "diamond-sword", name: "Diamond Sword", rarity: "SR", type: "Weapon", origin: "Minecraft", pullable: false,
    image: "images/items/diamond-sword.png", icon: "💎", duration: "permanent",
    stats: { Damage: "2d8 slashing", Range: "Melee" },
    description: "You keep this sword for the rest of the encounter. This is the sword's final tier.",
    flavor: "First, we mine. Then, we craft. Let's Minecraft!",
  },
  {
    id: "chain-hook", name: "Chain Hook", rarity: "SR", type: "Weapon", origin: "Overwatch",
    image: "images/items/chain-hook.png", icon: "⛓️", duration: 1,
    sound: "sounds/chain-hook/",
    stats: { Damage: "2d6 piercing", Range: "Melee / Hook 50 ft", Save: "Constitution, DC 8 + PB + STR" },
    description: "As an action, you can hurl the hook at a creature you can see within 50 feet of you and pull it into an unoccupied space within 5 feet of you. The creature must then succeed on a Constitution saving throw or have the Incapacitated condition until the start of your next turn.",
    flavor: "Hiii.",
  },
  {
    id: "golden-gun", name: "Golden Gun", rarity: "SR", type: "Weapon", origin: "James Bond",
    image: "images/items/golden-gun.png", icon: "🔫", duration: 1,
    sound: "sounds/golden-gun.mp3", soundVolume: 0.075,
    stats: { Damage: "2d10 piercing", Range: "50/150 ft", Properties: "Ammunition, Loading" },
    description: "When you make an attack with this weapon, flip a coin instead of rolling a d20.\nHeads: The attack is a critical hit, and you have immunity to all damage until the start of your next turn.\nTails: The attack misses, and until the start of your next turn, any attack roll that hits you is a critical hit.",
    flavor: "The name's Bond. James Bond.",
  },
  {
    id: "mjolnir", name: "Mjolnir", rarity: "SR", type: "Weapon", origin: "Thor",
    image: "images/items/mjolnir.png", icon: "🔨", duration: 1,
    sound: "sounds/mjolnir.mp3", soundVolume: 0.71,
    stats: { Damage: "1d8 bludgeoning + 1d4 lightning", Range: "Melee / Thrown 20/60 ft", Properties: "Thrown, Versatile (1d10)" },
    description: "When you hit a creature with this weapon, lightning arcs from it to each other enemy within 15 feet of it. Each of those enemies takes lightning damage equal to the damage you dealt to the target.",
    flavor: "Whosoever holds this hammer, if he be worthy, shall possess the power of Thor.",
  },
  {
    id: "beggars-bazooka", name: "Beggar's Bazooka", rarity: "SR", type: "Weapon", origin: "Team Fortress 2",
    image: "images/items/beggars-bazooka.png", icon: "🚀", duration: 1,
    sound: "sounds/beggars-bazooka.mp3", soundVolume: 0.1,
    stats: { Damage: "1d8 bludgeoning + 1d4 fire", Range: "100/300 ft", Properties: "Ammunition, Heavy, Two-handed", Overload: "On a 4: 10d6 fire, 20-ft radius", Save: "Dexterity, DC 8 + PB + DEX" },
    description: "Load Up. When you take the Attack action with this weapon, roll a d4 first. On a 1, 2 or 3, you can make that many attacks with it this turn, instead of your usual number of attacks.\nOverload. On a 4, the launcher self-destructs and explodes as a 5th-level Fireball centered on you. Each other creature within 20 feet of you makes a Dexterity saving throw, taking 10d6 fire damage on a failed save, or half as much on a successful one.",
    flavor: "What is better than killing a man with a highly explosive high velocity projectile launcher? Killing a man with a highly explosive high velocity projectile launcher that YOU HAVE MADE!",
  },

  // ---------------- SSR ----------------
  // SSR = the base weapon's dice + 1d8 bonus damage (a one-handed hit averages ~9).
  // The effect carries the rest of the power (and may outlast the turn).
  {
    id: "blue-shell", name: "Blue Shell", rarity: "SSR", type: "Weapon", origin: "Super Mario",
    image: "images/items/blue-shell.png", icon: "🐢", duration: 3,
    sound: "sounds/blue-shell.mp3", soundVolume: 0.35,
    stats: { Damage: "2d6 force", Multiplier: "×1, then ×2, then ×4", Target: "One creature you can see" },
    description: "As an action, launch the shell at one creature you can see. It takes 2d6 force damage. At the start of each of your next two turns, roll the damage again against the same creature, doubling the previous turn's multiplier: double damage on your next turn, then quadruple damage on the turn after. This doesn't require an action.",
    flavor: "The last shall be first, and the first, last.",
  },
  {
    id: "super-star", name: "Super Star", rarity: "SSR", type: "Wondrous Item", origin: "Super Mario",
    image: "images/items/super-star.png", icon: "⭐", duration: 2,
    sound: "sounds/super-star.mp3", soundVolume: 0.5,
    stats: { Effect: "Immunity to all damage", Lasts: "2 rounds" },
    description: "When you pull this item, you become invincible: until the start of your turn after next, you have immunity to all damage.",
    flavor: "Here's a rare item! I'm sure it'll come in handy...",
  },
  {
    id: "master-sword", name: "Master Sword", rarity: "SSR", type: "Weapon", origin: "The Legend of Zelda",
    image: "images/items/master-sword.png", icon: "🗡️", duration: 1,
    sound: "sounds/master-sword.mp3", soundVolume: 0.15,
    stats: { Damage: "1d8 slashing + 1d8 radiant", Range: "Melee / Sword Beam: unlimited", Properties: "Versatile (1d10)" },
    description: "Sword Beam. You can make a ranged attack with this weapon against any creature you can see, no matter how far away it is.\nSpin Attack. When you take the Attack action, you can give up two of your attacks to make one attack with this weapon against each creature of your choice that you can see, at any distance.",
    flavor: "A sword wields no strength unless the hand that holds it has courage.",
  },
  {
    id: "portal-gun", name: "Portal Gun", rarity: "SSR", type: "Wondrous Item", origin: "Portal",
    image: "images/items/portal-gun.png", icon: "🌀", duration: 1,
    sound: "sounds/portal-gun.mp3", soundVolume: 0.75,
    stats: { Use: "Action", Portals: "2, until combat ends" },
    description: "As an action, choose two points you can see and open a portal at each. Until combat ends, when you or an ally enters one portal's space, that creature can immediately teleport to an unoccupied space next to the other portal. This doesn't cost any extra movement. The portals can't be dismissed.",
    flavor: "Science isn't about why, it's about why not.",
  },
  {
    id: "jarona", name: "Jarona", rarity: "SSR", type: "Weapon", origin: "Deltarune",
    image: "images/items/jarona.png", icon: "🍊", duration: 1,
    sound: "sounds/jarona/", soundVolume: 2,
    stats: { Damage: "2d10 radiant", Range: "80/320 ft" },
    description: "Taunt. When you hit a creature with this weapon, it must target you with any attack or harmful spell it makes before the start of your next turn.\nJa-orange. When you score a critical hit with this weapon, it becomes a Ja-orange until the end of the turn. While it's a Ja-orange, creatures taunted by it also can't deal damage to you.",
    flavor: "Here I come, San Frandisco!!",
  },
  {
    id: "gungnir", name: "Gungnir", rarity: "SSR", type: "Weapon",
    image: "images/items/gungnir.png", icon: "🔱", duration: 1,
    sound: "sounds/gungnir.mp3", soundVolume: 0.2,
    stats: { Damage: "2d8 force", Range: "Melee / Thrown 20/60 ft", Properties: "Thrown, Versatile (2d10)", Save: "Charisma, DC 8 + PB + STR" },
    description: "When you hit a creature with this weapon, it becomes Marked for Death.\nMarked for Death: While the creature has fewer than half its hit points, attack rolls that you and your allies make against it automatically hit. The mark lasts until the creature uses its action to make a Charisma saving throw and succeeds.",
    flavor: "Odin owns all of you!",
  },

];

/* ---------------------------------------------------------------------
   LIMITED ROTATIONS
   Only the banner named in ACTIVE_LIMITED_BANNER is in the pool.
   Items from old rotations still show correctly in history.
   --------------------------------------------------------------------- */
const LIMITED_BANNERS = {
  fnaf: {
    name: "Fazbear's Frights",
    description: "I will put you back together.",
    items: [
      {
        id: "freddys-mask", name: "Freddy's Mask", rarity: "R", type: "Wondrous Item", origin: "Five Nights at Freddy's",
        image: "images/items/freddys-mask.png", icon: "✨", duration: 1,
        sound: "sounds/freddys-mask/",
        stats: { Use: "Action", Target: "You or a willing ally" },
        description: "As an action, you can put on this mask or place it on a willing ally. Until the start of your next turn, the wearer can't be targeted by attack rolls or spells.",
        flavor: "Perhaps some things are best left forgotten, for now.",
      },
      {
        id: "cupcake", name: "Mr. Cupcake", rarity: "SR", type: "Wondrous Item", origin: "Five Nights at Freddy's",
        image: "images/items/cupcake.png", icon: "🧁", duration: 1,
        sound: "sounds/cupcake.mp3", soundVolume: 0.4,
        stats: { Use: "Action", Damage: "3d6 necrotic", Range: "30 ft" },
        description: "As an action, choose one creature you can see within 30 feet of you. It takes 3d6 necrotic damage, and its hit point maximum is reduced to equal its current hit points until it finishes a long rest. If the creature has another phase or form with its own hit points, the reduction doesn't carry over to it.",
        flavor: "Some call him Cupcake, but we prefer the more respectful Mr. Cupcake.",
      },
      {
        id: "phone", name: "Phone", rarity: "SSR", type: "Wondrous Item", origin: "Five Nights at Freddy's",
        image: "images/items/phone.png", icon: "📞", duration: "permanent",
        sound: "sounds/phone.mp3", soundVolume: 0.3,
        stats: { Use: "Once per turn, no action", Damage: "2d10 psychic", Target: "Any creature in the fight" },
        description: "You keep this item for the rest of the encounter. Once on each of your turns, you can choose one creature in the fight. It takes 2d10 psychic damage. If it then has fewer hit points than you, it is executed and drops to 0 hit points.",
        flavor: "Hello? Hello hello? Uh, I wanted to record a message for you, to help you get settled in on your first night. Um, I actually worked in that office before you, I’m finishing up my last week now as a matter of fact. So, I know it can be a bit overwhelming, but I’m here to tell you there’s nothing to worry about, Uh, you’ll do fine. So, let’s just focus on getting you through your first week, okay? Uh, let’s see, first there’s an introductory greeting from the company, that I’m supposed to read. Uh, it’s kind of a legal thing, you know. Um, “Welcome to Freddy Fazbear’s Pizza, a magical place for kids and grown-ups alike, where fantasy and fun come to life. Fazbear Entertainment is not responsible for damage to property or person. Upon discovering that damage or death has occurred, a missing person report will be filed within 90 days, or as soon property and premises have been thoroughly cleaned and bleached, and the carpets have been replaced.” Blah blah blah. Now that might sound bad, I know. But, there’s really nothing to worry about.",
      }
    ],
  }
};
