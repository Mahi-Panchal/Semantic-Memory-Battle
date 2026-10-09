/**
 * eval-pairs.js — WordMind NLP Evaluation Dataset
 * 65 word pairs labelled: 1 = related, 0 = unrelated
 * 43 related / 22 unrelated (not balanced), including hard cases (antonyms, polysemy, near-misses)
 */
const EVAL_PAIRS = [
  // --- CLEARLY RELATED (should score >= threshold) ---
  { w1: "king",     w2: "queen",     label: 1, note: "royalty pair" },
  { w1: "ocean",    w2: "sea",       label: 1, note: "near synonyms" },
  { w1: "brain",    w2: "mind",      label: 1, note: "near synonyms" },
  { w1: "fire",     w2: "flame",     label: 1, note: "near synonyms" },
  { w1: "happy",    w2: "joy",       label: 1, note: "same sentiment" },
  { w1: "dog",      w2: "wolf",      label: 1, note: "related animals" },
  { w1: "sun",      w2: "star",      label: 1, note: "astronomy" },
  { w1: "book",     w2: "library",   label: 1, note: "associated" },
  { w1: "music",    w2: "song",      label: 1, note: "near synonyms" },
  { w1: "tree",     w2: "forest",    label: 1, note: "part-whole" },
  { w1: "water",    w2: "ocean",     label: 1, note: "substance-place" },
  { w1: "car",      w2: "vehicle",   label: 1, note: "hyponym-hypernym" },
  { w1: "apple",    w2: "fruit",     label: 1, note: "hyponym-hypernym" },
  { w1: "doctor",   w2: "hospital",  label: 1, note: "professional-place" },
  { w1: "rain",     w2: "cloud",     label: 1, note: "weather" },
  { w1: "knife",    w2: "blade",     label: 1, note: "part-whole" },
  { w1: "teacher",  w2: "school",    label: 1, note: "role-place" },
  { w1: "soldier",  w2: "war",       label: 1, note: "agent-event" },
  { w1: "piano",    w2: "music",     label: 1, note: "instrument-domain" },
  { w1: "cat",      w2: "kitten",    label: 1, note: "adult-juvenile" },
  { w1: "flower",   w2: "petal",     label: 1, note: "whole-part" },
  { w1: "sleep",    w2: "dream",     label: 1, note: "associated states" },
  { w1: "cold",     w2: "winter",    label: 1, note: "property-season" },
  { w1: "eagle",    w2: "bird",      label: 1, note: "hyponym-hypernym" },
  { w1: "river",    w2: "stream",    label: 1, note: "water bodies" },
  { w1: "laugh",    w2: "smile",     label: 1, note: "happy expressions" },
  { w1: "bread",    w2: "butter",    label: 1, note: "cultural pair" },
  { w1: "ship",     w2: "sailor",    label: 1, note: "vehicle-operator" },
  { w1: "house",    w2: "home",      label: 1, note: "near synonyms" },
  { w1: "dark",     w2: "night",     label: 1, note: "property-time" },

  // --- CLEARLY UNRELATED (should score < threshold) ---
  { w1: "banana",   w2: "justice",   label: 0, note: "unrelated domains" },
  { w1: "ocean",    w2: "grammar",   label: 0, note: "unrelated" },
  { w1: "dog",      w2: "algebra",   label: 0, note: "animal vs math" },
  { w1: "cloud",    w2: "invoice",   label: 0, note: "nature vs business" },
  { w1: "guitar",   w2: "volcano",   label: 0, note: "music vs geology" },
  { w1: "pencil",   w2: "hurricane", label: 0, note: "unrelated" },
  { w1: "table",    w2: "galaxy",    label: 0, note: "furniture vs space" },
  { w1: "apple",    w2: "submarine", label: 0, note: "food vs vehicle" },
  { w1: "smile",    w2: "circuit",   label: 0, note: "emotion vs tech" },
  { w1: "lamp",     w2: "dolphin",   label: 0, note: "object vs animal" },
  { w1: "stone",    w2: "symphony",  label: 0, note: "mineral vs music" },
  { w1: "bread",    w2: "satellite", label: 0, note: "food vs space tech" },
  { w1: "shadow",   w2: "economy",   label: 0, note: "unrelated" },
  { w1: "mirror",   w2: "jungle",    label: 0, note: "object vs nature" },
  { w1: "window",   w2: "tornado",   label: 0, note: "architecture vs weather" },
  { w1: "blanket",  w2: "photon",    label: 0, note: "object vs physics" },
  { w1: "candle",   w2: "democracy", label: 0, note: "object vs politics" },
  { w1: "honey",    w2: "parliament",label: 0, note: "food vs politics" },
  { w1: "clock",    w2: "sculpture", label: 0, note: "unrelated" },
  { w1: "river",    w2: "keyboard",  label: 0, note: "nature vs tech" },

  // --- HARD CASES: antonyms (semantically close but opposite in meaning) ---
  { w1: "hot",      w2: "cold",      label: 1, note: "antonyms - same semantic field, temperature" },
  { w1: "light",    w2: "dark",      label: 1, note: "antonyms - same conceptual axis" },
  { w1: "happy",    w2: "sad",       label: 1, note: "antonyms - emotion domain" },
  { w1: "fast",     w2: "slow",      label: 1, note: "antonyms - speed domain" },
  { w1: "big",      w2: "small",     label: 1, note: "antonyms - size domain" },

  // --- HARD CASES: polysemy / ambiguous ---
  { w1: "bank",     w2: "river",     label: 1, note: "polysemy - bank as riverbank" },
  { w1: "bark",     w2: "dog",       label: 1, note: "polysemy - bark as sound" },
  { w1: "pitch",    w2: "music",     label: 1, note: "polysemy - musical pitch" },
  { w1: "bank",     w2: "money",     label: 1, note: "polysemy - financial bank" },

  // --- HARD CASES: loosely related (tricky boundary) ---
  { w1: "pencil",   w2: "thought",   label: 0, note: "loosely related (writing/thinking) - should fail at normal threshold" },
  { w1: "salt",     w2: "ocean",     label: 1, note: "loosely related but shared" },
  { w1: "star",     w2: "celebrity", label: 1, note: "metaphor - both can mean 'star'" },
  { w1: "crown",    w2: "tooth",     label: 0, note: "polysemy trap - dental vs royal crown" },
  { w1: "net",      w2: "fish",      label: 1, note: "tool-target association" },
  { w1: "spring",   w2: "bounce",    label: 1, note: "polysemy - mechanical spring" }
];
