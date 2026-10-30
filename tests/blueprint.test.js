import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PLAN,
  FEATURE_IDS,
  PACE_IDS,
  PHASES,
  SCALE_IDS,
  SERVICES,
  SERVICE_IDS,
} from '../src/config.js';
import { estimate, formatInr } from '../src/estimate.js';
import { decodePlan, encodePlan } from '../src/share.js';
import { buildBrief } from '../src/brief.js';

const plan = (over = {}) => ({ services: ['web'], scale: 'mvp', features: [], pace: 'standard', ...over });

describe('estimate', () => {
  it('returns null when nothing is selected', () => {
    assert.equal(estimate(plan({ services: [] })), null);
  });

  it('uses the base effort for one service at first-version scale', () => {
    assert.equal(estimate(plan()).effort, SERVICES.web.baseWeeks);
  });

  it('discounts the second service for shared foundations', () => {
    const one = estimate(plan({ services: ['web'] })).effort;
    const two = estimate(plan({ services: ['web', 'dashboard'] })).effort;
    assert.ok(two < one + SERVICES.dashboard.baseWeeks);
    assert.ok(two > one);
  });

  it('costs more as features are added', () => {
    const base = estimate(plan());
    const more = estimate(plan({ features: ['auth', 'payments'] }));
    assert.ok(more.budget.low > base.budget.low);
  });

  it('costs more at larger scale', () => {
    assert.ok(estimate(plan({ scale: 'enterprise' })).budget.high > estimate(plan({ scale: 'mvp' })).budget.high);
  });

  it('makes urgent work shorter and more expensive than flexible work', () => {
    const urgent = estimate(plan({ pace: 'urgent' }));
    const flexible = estimate(plan({ pace: 'flexible' }));
    assert.ok(urgent.timeline.expected < flexible.timeline.expected);
    assert.ok(urgent.budget.low > flexible.budget.low);
  });

  it('keeps low below high for budget and timeline across every combination', () => {
    for (const scale of SCALE_IDS) {
      for (const pace of PACE_IDS) {
        const e = estimate(plan({ scale, pace, services: [...SERVICE_IDS], features: [...FEATURE_IDS] }));
        assert.ok(e.budget.low < e.budget.high);
        assert.ok(e.timeline.low < e.timeline.high);
      }
    }
  });

  it('lays phases end to end and they add up to the expected duration', () => {
    const e = estimate(DEFAULT_PLAN);
    assert.equal(e.phases.length, PHASES.length);
    const total = e.phases.reduce((s, p) => s + p.weeks, 0);
    assert.ok(Math.abs(total - e.timeline.expected) < 1e-9);
    for (let i = 1; i < e.phases.length; i++) {
      assert.ok(Math.abs(e.phases[i].startWeek - (e.phases[i - 1].startWeek + e.phases[i - 1].weeks)) < 1e-9);
    }
  });

  it('phase shares sum to one', () => {
    assert.ok(Math.abs(PHASES.reduce((s, p) => s + p.share, 0) - 1) < 1e-12);
  });

  it('merges stacks without duplicates', () => {
    const e = estimate(plan({ services: ['web', 'dashboard', 'mobile'] }));
    assert.equal(new Set(e.stack).size, e.stack.length);
  });

  it('lowers confidence as scope grows', () => {
    assert.equal(estimate(plan()).confidence, 'high');
    const big = estimate(plan({ scale: 'enterprise', services: ['web', 'ai', 'cloud'], features: [...FEATURE_IDS] }));
    assert.equal(big.confidence, 'low');
  });
});

describe('formatInr', () => {
  it('uses lakh and crore', () => {
    assert.equal(formatInr(45000), '₹45,000');
    assert.equal(formatInr(450000), '₹4.5 L');
    assert.equal(formatInr(1200000), '₹12 L');
    assert.equal(formatInr(12500000), '₹1.25 Cr');
  });
});

describe('share codes', () => {
  it('round-trips every combination of scale and pace', () => {
    for (const scale of SCALE_IDS) {
      for (const pace of PACE_IDS) {
        const p = plan({ scale, pace, services: ['ai', 'cloud'], features: ['rag', 'i18n', 'security'] });
        assert.deepEqual(decodePlan(encodePlan(p)), p);
      }
    }
  });

  it('round-trips the full selection and accepts a leading hash', () => {
    const p = plan({ services: [...SERVICE_IDS], features: [...FEATURE_IDS] });
    assert.deepEqual(decodePlan('#' + encodePlan(p)), p);
  });

  it('returns selections in canonical config order regardless of input order', () => {
    const shuffled = plan({ services: ['cloud', 'ai'], features: ['security', 'rag'] });
    assert.deepEqual(decodePlan(encodePlan(shuffled)), plan({ services: ['ai', 'cloud'], features: ['rag', 'security'] }));
  });

  it('rejects malformed or out-of-range codes', () => {
    for (const bad of ['', '#settings', 'p-', 'p-zzzzzz', 'p-<script>', 'p-1234567']) {
      assert.equal(decodePlan(bad), null, bad);
    }
  });
});

describe('brief', () => {
  it('includes the estimate, plan code and contact details', () => {
    const text = buildBrief(DEFAULT_PLAN, estimate(DEFAULT_PLAN), {
      name: 'Asha',
      email: 'asha@example.com',
      company: 'Acme',
      notes: 'Launch before Diwali',
    });
    assert.match(text, /Asha \(Acme\) <asha@example\.com>/);
    assert.match(text, /Launch before Diwali/);
    assert.ok(text.includes(`Plan code: ${encodePlan(DEFAULT_PLAN)}`));
    assert.match(text, /not a quote/);
  });

  it('handles an empty plan', () => {
    const text = buildBrief(plan({ services: [] }), null, { name: '', email: '', company: '', notes: '' });
    assert.match(text, /No service selected yet\./);
  });
});
