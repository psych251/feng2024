/*
 * The eleven bot strategies, shared by bot/index.html (the tournament page) and bot/player.js.
 *
 *   base:   rational   = take whichever option has the higher expected value (ties -> safe)
 *           aggressive = always take the gamble
 *           random     = 50/50
 *   sound:  gamble on the first 10 rare sequences heard; keep gambling on rare sequences only
 *           if those 10 gambles beat the sure amounts in total; otherwise back to the base rule
 *   end:    at trial 90 every bot in the run pauses and compares points with the target
 *           (the median of all 11 bots, or of the 4 base bots marked base4)
 *           lock  = play safe for trials 91-120 if above the target
 *           chase = gamble on trials 91-120 if below the target
 *           both  = lock if above, chase if below
 */
window.FENG_BOTS = [
  { key: "b01", name: "Rational", base: "rational", sound: false, end: "none", base4: true },
  { key: "b02", name: "Rational + lock in", base: "rational", sound: false, end: "lock" },
  { key: "b03", name: "Rational + chase", base: "rational", sound: false, end: "chase" },
  { key: "b04", name: "Rational + lock in/chase", base: "rational", sound: false, end: "both" },
  { key: "b05", name: "Rational + sound", base: "rational", sound: true, end: "none", base4: true },
  { key: "b06", name: "Rational + sound + lock in", base: "rational", sound: true, end: "lock" },
  { key: "b07", name: "Rational + sound + chase", base: "rational", sound: true, end: "chase" },
  { key: "b08", name: "Rational + sound + lock in/chase", base: "rational", sound: true, end: "both" },
  { key: "b09", name: "Aggressive", base: "aggressive", sound: false, end: "none", base4: true },
  { key: "b10", name: "Aggressive + lock in", base: "aggressive", sound: false, end: "lock" },
  { key: "b11", name: "Random", base: "random", sound: false, end: "none", base4: true },
];
window.FENG_BOT_SETTINGS = {
  check_at: 90,
  test_rare: 10,
  // Where bot runs go in Firestore when saving is on: experiments/<this>/participants/...
  // Never the pilot collection. Must end in "-bots" (checked by player.js).
  firebase_experiment_id: "feng2024-lite-bots",
  // Trials per write for bots: one chunk per session, about 8 writes per bot run in total.
  chunk_size: 500,
};
