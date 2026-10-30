import {
  BUFFER_WEEKS,
  FEATURES,
  PACES,
  PHASES,
  RANGE_HIGH,
  RANGE_LOW,
  RATE_PER_PERSON_WEEK,
  SCALES,
  SERVICES,
  SHARED_FOUNDATION_FACTOR,
  TEAM_EFFICIENCY,
} from './config.js';

/** @typedef {import('./config.js').PlanInput} PlanInput */
/** @typedef {'high'|'medium'|'low'} Confidence */
/** @typedef {{id: string, label: string, startWeek: number, weeks: number}} PhasePlan */
/**
 * @typedef {Object} Estimate
 * @property {number} effort Expected effort in person-weeks.
 * @property {number} team
 * @property {{low: number, high: number}} budget INR.
 * @property {{low: number, high: number, expected: number}} timeline Weeks.
 * @property {PhasePlan[]} phases
 * @property {string[]} stack
 * @property {string[]} notes
 * @property {Confidence} confidence
 * @property {string} confidenceReason
 */

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const roundTo = (n, step) => Math.round(n / step) * step;

/**
 * Turns a plan into an indicative estimate. Pure and deterministic, so the same plan
 * always gives the same numbers and a plan can be shared by code.
 * Returns null when no service is selected.
 * @param {PlanInput} input
 * @returns {Estimate | null}
 */
export function estimate(input) {
  if (input.services.length === 0) return null;

  const scale = SCALES[input.scale];
  const pace = PACES[input.pace];

  const services = input.services.map((id) => SERVICES[id]).sort((a, b) => b.baseWeeks - a.baseWeeks);

  const serviceWeeks = services.reduce(
    (sum, svc, i) => sum + svc.baseWeeks * scale.factor * (i === 0 ? 1 : SHARED_FOUNDATION_FACTOR),
    0,
  );

  // Features grow with scale, but more slowly than whole services do.
  const featureFactor = 1 + (scale.factor - 1) * 0.5;
  const featureWeeks = input.features.reduce((sum, id) => sum + FEATURES[id].weeks * featureFactor, 0);

  const effort = serviceWeeks + featureWeeks;
  const team = clamp(Math.ceil(effort / 10), 1, 8);
  const expectedWeeks = (effort / (team * TEAM_EFFICIENCY) + BUFFER_WEEKS) * pace.duration;

  const costBase = effort * RATE_PER_PERSON_WEEK * pace.cost;
  const budget = {
    low: roundTo(costBase * RANGE_LOW, 5000),
    high: roundTo(costBase * RANGE_HIGH, 5000),
  };

  const timeline = {
    expected: expectedWeeks,
    low: Math.max(2, Math.ceil(expectedWeeks * 0.9)),
    high: Math.ceil(expectedWeeks * 1.25),
  };

  let cursor = 0;
  const phases = PHASES.map((p) => {
    const weeks = p.share * expectedWeeks;
    const plan = { id: p.id, label: p.label, startWeek: cursor, weeks };
    cursor += weeks;
    return plan;
  });

  const stack = Array.from(new Set(input.services.flatMap((id) => SERVICES[id].stack)));

  const notes = input.features.map((id) => FEATURES[id].note);
  if (input.services.length > 1) {
    notes.push('Shared foundations (accounts, infrastructure, design system) are built once and reused across services.');
  }
  if (input.pace === 'urgent') {
    notes.push('A shorter schedule needs a larger team from day one and leaves less room for rework.');
  }
  notes.push('Hosting, third-party licences and API usage fees are billed at cost and are not included.');

  const { confidence, confidenceReason } = rateConfidence(input);

  return { effort, team, budget, timeline, phases, stack, notes, confidence, confidenceReason };
}

/** @param {PlanInput} input */
function rateConfidence(input) {
  let risk = 0;
  const reasons = [];

  if (input.scale === 'enterprise') {
    risk += 2;
    reasons.push('enterprise scale');
  } else if (input.scale === 'growth') {
    risk += 1;
  }

  if (input.services.length >= 3) {
    risk += 2;
    reasons.push('three or more services');
  } else if (input.services.length === 2) {
    risk += 1;
  }

  if (input.features.length >= 6) {
    risk += 2;
    reasons.push('a long feature list');
  } else if (input.features.length >= 4) {
    risk += 1;
  }

  if (input.pace === 'urgent') {
    risk += 1;
    reasons.push('a compressed schedule');
  }

  if (risk <= 1) {
    return { confidence: /** @type {Confidence} */ ('high'), confidenceReason: 'A focused scope. The range is tight.' };
  }
  if (risk <= 3) {
    return { confidence: /** @type {Confidence} */ ('medium'), confidenceReason: 'A discovery call will narrow this range.' };
  }
  const why = reasons.length ? `Driven by ${reasons.join(', ')}. ` : '';
  return {
    confidence: /** @type {Confidence} */ ('low'),
    confidenceReason: `${why}Treat this as a starting point and book a discovery call.`,
  };
}

function trim(n, digits) {
  return n.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

/**
 * Formats rupees in the Indian convention: lakh and crore.
 * @param {number} amount
 */
export function formatInr(amount) {
  if (amount >= 10000000) return `₹${trim(amount / 10000000, 2)} Cr`;
  if (amount >= 100000) return `₹${trim(amount / 100000, 1)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}
