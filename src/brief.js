import { FEATURES, PACES, SCALES, SERVICES } from './config.js';
import { formatInr } from './estimate.js';
import { encodePlan } from './share.js';

/** @typedef {{name: string, email: string, company: string, notes: string}} Contact */

/**
 * Plain-text brief a visitor can paste into an email or hand to the Cynbit team.
 * @param {import('./config.js').PlanInput} plan
 * @param {import('./estimate.js').Estimate | null} est
 * @param {Contact} contact
 */
export function buildBrief(plan, est, contact) {
  const lines = ['Project brief for Cynbit Technologies', ''];

  const name = contact.name.trim();
  const company = contact.company.trim();
  const email = contact.email.trim();
  const who = [name, company && `(${company})`, email && `<${email}>`].filter(Boolean).join(' ');
  lines.push(`From: ${who || 'Not provided yet'}`, '');

  if (!est) {
    lines.push('No service selected yet.');
    return lines.join('\n');
  }

  lines.push('What I want built');
  plan.services.forEach((id) => lines.push(`- ${SERVICES[id].label}`));
  lines.push('');
  lines.push(`Stage: ${SCALES[plan.scale].label}`);
  lines.push(`Schedule: ${PACES[plan.pace].label}`);
  if (plan.features.length) {
    lines.push('', 'Needs');
    plan.features.forEach((id) => lines.push(`- ${FEATURES[id].label}`));
  }

  lines.push(
    '',
    'Indicative estimate (from the Project Blueprint tool, not a quote)',
    `- Budget: ${formatInr(est.budget.low)} to ${formatInr(est.budget.high)}`,
    `- Timeline: ${est.timeline.low} to ${est.timeline.high} weeks`,
    `- Team: ${est.team} ${est.team === 1 ? 'engineer' : 'engineers'}`,
    `- Confidence: ${est.confidence}`,
    `- Suggested stack: ${est.stack.join(', ')}`,
  );

  if (contact.notes.trim()) lines.push('', 'Notes', contact.notes.trim());

  lines.push('', `Plan code: ${encodePlan(plan)}`);
  return lines.join('\n');
}

/**
 * @param {string} to
 * @param {string} subject
 * @param {string} body
 */
export function mailtoHref(to, subject, body) {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
