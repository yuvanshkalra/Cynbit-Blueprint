/**
 * All tunable numbers live here so Cynbit can calibrate the estimator against real
 * project history without touching logic. Every figure below is an illustrative
 * placeholder for the prototype, not a Cynbit price.
 */

/** @typedef {'ai'|'web'|'mobile'|'cloud'|'growth'|'dashboard'} ServiceId */
/** @typedef {'mvp'|'growth'|'enterprise'} ScaleId */
/** @typedef {'flexible'|'standard'|'urgent'} PaceId */
/** @typedef {'auth'|'payments'|'integrations'|'rag'|'voice'|'analytics'|'admin'|'i18n'|'security'} FeatureId */
/**
 * @typedef {Object} PlanInput
 * @property {ServiceId[]} services
 * @property {ScaleId} scale
 * @property {FeatureId[]} features
 * @property {PaceId} pace
 */

export const CONTACT_EMAIL = 'opportunities@cynbit.in';

/** Blended delivery rate, INR per person-week. */
export const RATE_PER_PERSON_WEEK = 45000;
/** Low and high ends of the budget range, relative to the expected effort. */
export const RANGE_LOW = 0.85;
export const RANGE_HIGH = 1.3;
/** A second or third service reuses auth, infra and design work from the first. */
export const SHARED_FOUNDATION_FACTOR = 0.85;
/** Share of a person-week that becomes delivered work once coordination is counted. */
export const TEAM_EFFICIENCY = 0.75;
/** Fixed weeks for kickoff, handover and review that do not shrink with team size. */
export const BUFFER_WEEKS = 1.5;

export const SERVICE_IDS = /** @type {ServiceId[]} */ (['ai', 'web', 'mobile', 'dashboard', 'cloud', 'growth']);

export const SERVICES = {
  ai: {
    label: 'AI agent or automation',
    blurb: 'Agents, LLM workflows, document handling, voice assistants.',
    baseWeeks: 8,
    stack: ['Python', 'FastAPI', 'LangChain', 'OpenAI', 'Pinecone'],
  },
  web: {
    label: 'Web platform or SaaS',
    blurb: 'Customer-facing product with accounts and a database.',
    baseWeeks: 10,
    stack: ['TypeScript', 'Next.js', 'NestJS', 'PostgreSQL', 'Tailwind'],
  },
  mobile: {
    label: 'Mobile app',
    blurb: 'iOS and Android from one codebase, with a backend.',
    baseWeeks: 12,
    stack: ['React', 'TypeScript', 'NestJS', 'PostgreSQL'],
  },
  dashboard: {
    label: 'Dashboard or internal tool',
    blurb: 'Reporting, operations and admin tooling for your team.',
    baseWeeks: 6,
    stack: ['React', 'TypeScript', 'PostgreSQL', 'Redis'],
  },
  cloud: {
    label: 'Cloud or legacy migration',
    blurb: 'Move a monolith to AWS or Azure with CI/CD and monitoring.',
    baseWeeks: 9,
    stack: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
  },
  growth: {
    label: 'SEO and growth engine',
    blurb: 'Technical SEO, landing pages, ads and CRM automation.',
    baseWeeks: 5,
    stack: ['Next.js', 'Technical SEO', 'Google & Meta Ads', 'CRM automation'],
  },
};

export const SCALE_IDS = /** @type {ScaleId[]} */ (['mvp', 'growth', 'enterprise']);

export const SCALES = {
  mvp: { label: 'First version', blurb: 'Prove the idea with a focused core.', factor: 1 },
  growth: { label: 'Growing product', blurb: 'Real users, several roles, steady releases.', factor: 1.6 },
  enterprise: { label: 'Enterprise grade', blurb: 'Heavy load, audits, many teams.', factor: 2.6 },
};

export const PACE_IDS = /** @type {PaceId[]} */ (['flexible', 'standard', 'urgent']);

export const PACES = {
  flexible: { label: 'Flexible', blurb: 'Smaller team, longer runway.', cost: 0.95, duration: 1.15 },
  standard: { label: 'Standard', blurb: 'Balanced team and schedule.', cost: 1, duration: 1 },
  urgent: { label: 'Urgent', blurb: 'Bigger team, shorter schedule.', cost: 1.25, duration: 0.8 },
};

export const FEATURE_IDS = /** @type {FeatureId[]} */ ([
  'auth',
  'payments',
  'integrations',
  'rag',
  'voice',
  'analytics',
  'admin',
  'i18n',
  'security',
]);

/** `note` is shown as an assumption or risk when the feature is selected. */
export const FEATURES = {
  auth: { label: 'Accounts and roles', weeks: 1.5, note: 'Sign-in uses a standard provider; custom SSO would add time.' },
  payments: {
    label: 'Payments and billing',
    weeks: 2,
    note: 'Assumes one payment gateway. Subscriptions, invoicing and refunds are in scope; tax filing is not.',
  },
  integrations: {
    label: 'CRM, ERP or API integrations',
    weeks: 2.5,
    note: 'Third-party API limits and sandbox access can move the schedule.',
  },
  rag: {
    label: 'AI over your own documents',
    weeks: 3,
    note: 'Answer quality depends on how clean your source data is. A data audit happens in discovery.',
  },
  voice: {
    label: 'Voice agent',
    weeks: 4,
    note: 'Latency and accent coverage need real call testing before launch.',
  },
  analytics: {
    label: 'Analytics and reporting',
    weeks: 2,
    note: 'Metrics definitions are agreed with you before charts are built.',
  },
  admin: { label: 'Admin panel', weeks: 2, note: 'Covers content, user and order management for your staff.' },
  i18n: { label: 'Multiple languages', weeks: 1.5, note: 'Translations are supplied by you or a translation partner.' },
  security: {
    label: 'Security review and compliance',
    weeks: 2.5,
    note: 'Covers a security audit and fixes. A formal certification process is separate.',
  },
};

/** Cynbit's own six-step lifecycle, as published on cynbit.in. Shares sum to 1. */
export const PHASES = [
  { id: 'discovery', label: 'Discovery and audit', share: 0.08 },
  { id: 'strategy', label: 'Strategy and blueprint', share: 0.1 },
  { id: 'design', label: 'Design', share: 0.14 },
  { id: 'build', label: 'Implementation', share: 0.46 },
  { id: 'qa', label: 'Quality and security check', share: 0.12 },
  { id: 'launch', label: 'Deployment and handover', share: 0.1 },
];

/** @type {PlanInput} */
export const DEFAULT_PLAN = {
  services: ['ai', 'dashboard'],
  scale: 'mvp',
  features: ['auth', 'rag', 'analytics'],
  pace: 'standard',
};
