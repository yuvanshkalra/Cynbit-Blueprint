import { FEATURE_IDS, PACE_IDS, SCALE_IDS, SERVICE_IDS } from './config.js';

/**
 * A plan packs into one small integer, written in base 36, so any plan can be shared as a
 * short code like "p-1k9f". Layout, low bit first:
 *   6 bits services | 9 bits features | 2 bits scale | 2 bits pace
 */
const PREFIX = 'p-';
const SERVICE_BITS = SERVICE_IDS.length;
const FEATURE_BITS = FEATURE_IDS.length;
const SCALE_SHIFT = SERVICE_BITS + FEATURE_BITS;
const PACE_SHIFT = SCALE_SHIFT + 2;

/** @param {import('./config.js').PlanInput} plan */
export function encodePlan(plan) {
  let value = 0;
  SERVICE_IDS.forEach((id, i) => {
    if (plan.services.includes(id)) value |= 1 << i;
  });
  FEATURE_IDS.forEach((id, i) => {
    if (plan.features.includes(id)) value |= 1 << (SERVICE_BITS + i);
  });
  value |= SCALE_IDS.indexOf(plan.scale) << SCALE_SHIFT;
  value |= PACE_IDS.indexOf(plan.pace) << PACE_SHIFT;
  return PREFIX + value.toString(36);
}

/**
 * Accepts "p-xxxx" or "#p-xxxx". Returns null for anything that is not a valid code.
 * @param {string} code
 * @returns {import('./config.js').PlanInput | null}
 */
export function decodePlan(code) {
  const match = /^#?p-([0-9a-z]{1,6})$/.exec(String(code).trim().toLowerCase());
  if (!match) return null;
  const value = parseInt(match[1], 36);
  if (!Number.isFinite(value)) return null;

  const scaleIndex = (value >> SCALE_SHIFT) & 3;
  const paceIndex = (value >> PACE_SHIFT) & 3;
  if (scaleIndex >= SCALE_IDS.length || paceIndex >= PACE_IDS.length) return null;
  if (value >> (PACE_SHIFT + 2) !== 0) return null;

  return {
    services: SERVICE_IDS.filter((_, i) => value & (1 << i)),
    features: FEATURE_IDS.filter((_, i) => value & (1 << (SERVICE_BITS + i))),
    scale: SCALE_IDS[scaleIndex],
    pace: PACE_IDS[paceIndex],
  };
}
