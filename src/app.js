import {
  CONTACT_EMAIL,
  DEFAULT_PLAN,
  FEATURES,
  FEATURE_IDS,
  PACES,
  PACE_IDS,
  SCALES,
  SCALE_IDS,
  SERVICES,
  SERVICE_IDS,
} from './config.js';
import { estimate, formatInr } from './estimate.js';
import { decodePlan, encodePlan } from './share.js';
import { buildBrief, mailtoHref } from './brief.js';

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const fromHash = decodePlan(location.hash);
/** @type {import('./config.js').PlanInput} */
let plan = fromHash ?? structuredClone(DEFAULT_PLAN);
let touched = Boolean(fromHash);
const contact = { name: '', email: '', company: '', notes: '' };

/* ---------- Form ---------- */

function checkbox(name, id, label, blurb) {
  return `<label class="choice"><input type="checkbox" name="${name}" value="${id}" id="${name}-${id}">
    <span class="choice-body"><strong>${esc(label)}</strong>${blurb ? `<span>${esc(blurb)}</span>` : ''}</span></label>`;
}

function radio(name, id, label, blurb) {
  return `<label class="choice"><input type="radio" name="${name}" value="${id}" id="${name}-${id}">
    <span class="choice-body"><strong>${esc(label)}</strong><span>${esc(blurb)}</span></span></label>`;
}

function buildForm() {
  $('plan-form').innerHTML = `
    <fieldset>
      <legend>What are you building?</legend>
      <p class="hint">Pick everything that applies. Work that shares foundations costs less than separate projects.</p>
      <div class="choices">${SERVICE_IDS.map((id) => checkbox('service', id, SERVICES[id].label, SERVICES[id].blurb)).join('')}</div>
    </fieldset>
    <fieldset>
      <legend>How far along is it?</legend>
      <div class="choices">${SCALE_IDS.map((id) => radio('scale', id, SCALES[id].label, SCALES[id].blurb)).join('')}</div>
    </fieldset>
    <fieldset>
      <legend>What does it need?</legend>
      <p class="hint">Each item adds scope. Leave anything unchecked that you can add later.</p>
      <div class="choices compact">${FEATURE_IDS.map((id) => checkbox('feature', id, FEATURES[id].label, '')).join('')}</div>
    </fieldset>
    <fieldset>
      <legend>How fast do you need it?</legend>
      <div class="choices">${PACE_IDS.map((id) => radio('pace', id, PACES[id].label, PACES[id].blurb)).join('')}</div>
    </fieldset>`;
}

function syncControls() {
  const form = $('plan-form');
  form.querySelectorAll('input[name="service"]').forEach((el) => (el.checked = plan.services.includes(el.value)));
  form.querySelectorAll('input[name="feature"]').forEach((el) => (el.checked = plan.features.includes(el.value)));
  form.querySelectorAll('input[name="scale"]').forEach((el) => (el.checked = el.value === plan.scale));
  form.querySelectorAll('input[name="pace"]').forEach((el) => (el.checked = el.value === plan.pace));
}

function readControls() {
  const form = $('plan-form');
  const checked = (name) => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
  plan = {
    services: SERVICE_IDS.filter((id) => checked('service').includes(id)),
    features: FEATURE_IDS.filter((id) => checked('feature').includes(id)),
    scale: checked('scale')[0] ?? plan.scale,
    pace: checked('pace')[0] ?? plan.pace,
  };
}

/* ---------- Estimate sheet ---------- */

const weeks = (n) => (Math.round(n * 10) / 10).toString();

function niceStep(total) {
  if (total <= 12) return 2;
  if (total <= 24) return 4;
  if (total <= 48) return 8;
  return 12;
}

function ganttHtml(est) {
  const total = est.timeline.expected;
  const step = niceStep(total);
  const tick = (step / total) * 100;
  const ticks = [];
  for (let t = 0; t <= total; t += step) ticks.push(t);

  const rows = est.phases
    .map((p) => {
      const left = (p.startWeek / total) * 100;
      const width = (p.weeks / total) * 100;
      const labelRight = left + width < 82;
      const valStyle = labelRight ? `left:calc(${left + width}% + 6px)` : `right:calc(${100 - left}% + 6px)`;
      return `<div class="g-row">
        <span class="g-label">${esc(p.label)}</span>
        <div class="g-track" style="--tick:${tick}%">
          <div class="g-bar ${p.id === 'build' ? 'build' : ''}" style="left:${left}%;width:${width}%"></div>
          <span class="g-val" style="${valStyle}">${weeks(p.weeks)} wk</span>
        </div>
      </div>`;
    })
    .join('');

  const axis = `<div class="g-axis"><span>Week</span><div class="g-ticks">${ticks
    .map((t) => `<span style="left:${(t / total) * 100}%">${t}</span>`)
    .join('')}</div></div>`;

  return `<div class="gantt" role="img" aria-label="Delivery plan over about ${weeks(total)} weeks">${rows}${axis}</div>`;
}

function renderSheet(est) {
  const sheet = $('sheet');
  if (!est) {
    sheet.innerHTML = `<div class="empty">
      <h2>Your estimate appears here</h2>
      <p class="muted">Pick at least one thing to build and the budget, timeline and team will fill in.</p>
    </div>`;
    return;
  }

  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  sheet.innerHTML = `
    <div class="sheet-head">
      <h2>Indicative estimate</h2>
      <span class="pill ${est.confidence}">Confidence: ${est.confidence}</span>
    </div>
    <dl class="figures">
      <div class="budget"><dt>Budget range</dt><dd class="big">${formatInr(est.budget.low)} to ${formatInr(est.budget.high)}</dd></div>
      <div><dt>Timeline</dt><dd>${est.timeline.low} to ${est.timeline.high} weeks</dd></div>
      <div><dt>Team</dt><dd>${est.team} ${est.team === 1 ? 'engineer' : 'engineers'}</dd></div>
      <div><dt>Effort</dt><dd>${Math.round(est.effort)} person-weeks</dd></div>
    </dl>
    <p class="reason">${esc(est.confidenceReason)}</p>
    <section class="block"><h3>Delivery plan</h3>${ganttHtml(est)}</section>
    <section class="block"><h3>Suggested stack</h3><ul class="chips">${est.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></section>
    <section class="block"><h3>Assumptions and risks</h3><ul class="notes">${est.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></section>
    <div class="titleblock">
      <div><span>Prepared for</span><b>${esc(contact.company.trim() || contact.name.trim() || 'Your project')}</b></div>
      <div><span>Plan code</span><b class="mono">${encodePlan(plan)}</b></div>
      <div><span>Date</span><b>${date}</b></div>
    </div>`;
}

/* ---------- Brief, sharing, mobile strip ---------- */

function renderBrief(est) {
  const text = buildBrief(plan, est, contact);
  $('brief-text').value = text;
  const code = encodePlan(plan);
  $('plan-code').textContent = code;
  $('to-address').textContent = CONTACT_EMAIL;
  $('mailto').setAttribute('href', mailtoHref(CONTACT_EMAIL, 'Project brief from Project Blueprint', text));
  $('share-link').value = `${location.href.split('#')[0]}#${code}`;
}

function renderStrip(est) {
  const strip = $('strip');
  strip.hidden = !est;
  document.body.classList.toggle('has-strip', Boolean(est));
  if (est) $('strip-budget').textContent = `${formatInr(est.budget.low)} to ${formatInr(est.budget.high)}`;
}

function update() {
  const est = estimate(plan);
  renderSheet(est);
  renderBrief(est);
  renderStrip(est);
  $('sample-note').hidden = touched;
  try {
    history.replaceState(null, '', `#${encodePlan(plan)}`);
  } catch {
    /* Some embedded viewers block history changes. The plan still works without it. */
  }
}

let statusTimer;
function say(message) {
  const el = $('status');
  el.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => (el.textContent = ''), 4000);
}

async function copyFrom(el, doneMessage) {
  try {
    await navigator.clipboard.writeText(el.value);
    say(doneMessage);
  } catch {
    el.classList.remove('visually-hidden');
    el.removeAttribute('tabindex');
    el.select();
    say('Your browser blocked automatic copy. The text is selected; press Ctrl+C or Cmd+C.');
  }
}

/* ---------- Wiring ---------- */

buildForm();
syncControls();

$('plan-form').addEventListener('change', () => {
  touched = true;
  readControls();
  update();
});

for (const [id, key] of [['c-name', 'name'], ['c-email', 'email'], ['c-company', 'company'], ['c-notes', 'notes']]) {
  $(id).addEventListener('input', (e) => {
    contact[key] = e.target.value;
    const est = estimate(plan);
    renderBrief(est);
    renderSheet(est);
  });
}

$('copy-brief').addEventListener('click', () => copyFrom($('brief-text'), 'Brief copied.'));
$('copy-link').addEventListener('click', () => copyFrom($('share-link'), 'Plan link copied.'));
$('strip-view').addEventListener('click', () => $('sheet').scrollIntoView({ behavior: 'smooth', block: 'start' }));

window.addEventListener('hashchange', () => {
  const next = decodePlan(location.hash);
  if (next && encodePlan(next) !== encodePlan(plan)) {
    plan = next;
    touched = true;
    syncControls();
    update();
  }
});

update();
