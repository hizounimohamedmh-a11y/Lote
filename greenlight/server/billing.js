import Stripe from 'stripe';
import { db } from './db.js';

const key = process.env.STRIPE_SECRET_KEY;
export const PRICES = { pro: process.env.STRIPE_PRICE_PRO, team: process.env.STRIPE_PRICE_TEAM };
export const stripe = key ? new Stripe(key) : null;
export const billingEnabled = Boolean(stripe && PRICES.pro);

const ACTIVE = new Set(['active', 'trialing', 'past_due']);

// What a user can use right now.
export function accessInfo(user) {
  const trialActive = new Date(user.trial_ends_at) > new Date();
  const subscribed = ACTIVE.has(user.subscription_status);
  const open = !billingEnabled || Boolean(user.is_admin);
  return {
    billingEnabled,
    plan: subscribed ? user.plan : 'free',
    trialActive,
    trialEndsAt: user.trial_ends_at,
    pro: open || trialActive || (subscribed && ['pro', 'team'].includes(user.plan)),
    team: open || trialActive || (subscribed && user.plan === 'team'),
  };
}

function baseUrl(req) {
  return process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

export async function createCheckout(req, plan) {
  const price = PRICES[plan];
  if (!price) throw Object.assign(new Error('This plan is not available.'), { status: 400 });
  const user = req.user;
  let customer = user.stripe_customer_id;
  if (!customer) {
    customer = (await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: String(user.id) } })).id;
    db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customer, user.id);
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${baseUrl(req)}/#/account?paid=1`,
    cancel_url: `${baseUrl(req)}/#/account`,
  });
  return session.url;
}

export async function createPortal(req) {
  const session = await stripe.billingPortal.sessions.create({ customer: req.user.stripe_customer_id, return_url: `${baseUrl(req)}/#/account` });
  return session.url;
}

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
    const priceId = sub.items?.data?.[0]?.price?.id;
    const plan = priceId === PRICES.team ? 'team' : 'pro';
    db.prepare('UPDATE users SET subscription_status = ?, plan = ? WHERE stripe_customer_id = ?').run(status, plan, sub.customer);
  }
  res.json({ received: true });
}
