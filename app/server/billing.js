import Stripe from 'stripe';
import { db } from './db.js';

const key = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRICE_ID;
export const stripe = key ? new Stripe(key) : null;
export const billingEnabled = Boolean(stripe && priceId);

const ACTIVE = new Set(['active', 'trialing', 'past_due']);

export function accessInfo(user) {
  const trialActive = new Date(user.trial_ends_at) > new Date();
  const subscribed = ACTIVE.has(user.subscription_status);
  const hasAccess = !billingEnabled || Boolean(user.is_admin) || subscribed || trialActive;
  return {
    billingEnabled,
    hasAccess,
    subscribed,
    trialActive,
    trialEndsAt: user.trial_ends_at,
    status: user.subscription_status,
  };
}

// Blocks learning endpoints when the trial is over and there is no subscription.
export function requireAccess(req, res, next) {
  if (!accessInfo(req.user).hasAccess) {
    return res.status(402).json({ error: 'Your free trial has ended. Subscribe to keep learning.' });
  }
  next();
}

function baseUrl(req) {
  return process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

export async function createCheckout(req) {
  const user = req.user;
  let customer = user.stripe_customer_id;
  if (!customer) {
    const c = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: String(user.id) } });
    customer = c.id;
    db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customer, user.id);
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${baseUrl(req)}/#/account?paid=1`,
    cancel_url: `${baseUrl(req)}/#/account`,
    metadata: { userId: String(user.id) },
  });
  return session.url;
}

export async function createPortal(req) {
  const session = await stripe.billingPortal.sessions.create({
    customer: req.user.stripe_customer_id,
    return_url: `${baseUrl(req)}/#/account`,
  });
  return session.url;
}

// Express handler; must receive the raw body.
export function webhook(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type.startsWith('customer.subscription.')) {
    const sub = event.data.object;
    const status = event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status;
    db.prepare('UPDATE users SET subscription_status = ? WHERE stripe_customer_id = ?').run(status, sub.customer);
  }
  res.json({ received: true });
}
