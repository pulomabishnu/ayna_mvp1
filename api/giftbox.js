/**
 * Gift box shop (/gift). Two ways in:
 *   - a winner's one-time link: /gift/<token>. No account needed; the link is the key.
 *   - an admin, signed in (ADMIN_EMAILS / CAMPAIGN_TEAM_EMAIL), at /gift: no limit.
 *
 *   GET  /api/giftbox?token=<token>      winner: products + limit
 *   GET  /api/giftbox                    admin (Bearer session): products
 *   POST { token?, items: [{ id, qty }], shipping: {...} }   free checkout
 *
 * Prices, the limit and "one order per link" are enforced in the database
 * (giftbox_checkout), never trusted from the browser.
 */
import { verifyUser } from './_usageLimit.js';
import { getServiceClient, isCampaignAdmin, setPrivateHeaders } from './_campaign.js';
import { sendCampaignEmail, sendTeamAlert } from './_campaignEmail.js';
import { syncFromSheet } from './_giftboxSheet.js';
import { TOKEN_RE, parseCart, parseShipping, publicProduct, teamOrderEmail, winnerConfirmationEmail } from './_giftbox.js';

const LINK_ERRORS = { invalid_link: 404, already_used: 410, expired: 410 };

async function loadInvite(db, token) {
  if (!TOKEN_RE.test(token)) return { error: 'invalid_link' };
  const { data, error } = await db.from('giftbox_invites').select('id, winner_name, budget_cents, status, expires_at').eq('token', token).maybeSingle();
  if (error) throw error;
  if (!data || data.status === 'revoked') return { error: 'invalid_link' };
  const firstName = String(data.winner_name || '').split(' ')[0];
  if (data.status === 'redeemed') return { error: 'already_used', firstName };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { error: 'expired', firstName };
  return { invite: data, firstName };
}

async function loadProducts(db) {
  // Picks up Google Sheet edits at most every few minutes; never blocks on a sheet problem.
  await syncFromSheet(db);
  const { data, error } = await db.from('giftbox_products').select('*').eq('is_active', true)
    .order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(publicProduct);
}

/** The signed-in admin, or an error response already sent. */
async function requireAdmin(req, res) {
  const { user, error } = await verifyUser(req);
  if (error === 'server_misconfigured' || error === 'auth_error') { res.status(503).json({ error: 'unavailable' }); return null; }
  if (error || !user) { res.status(401).json({ error: 'auth_required' }); return null; }
  if (!isCampaignAdmin(user)) { res.status(403).json({ error: 'forbidden' }); return null; }
  return user;
}

export default async function handler(req, res) {
  setPrivateHeaders(res);
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const db = getServiceClient();
  if (!db) return res.status(503).json({ error: 'unavailable' });

  try {
    if (req.method === 'GET') {
      const token = String(req.query?.token || '');
      if (token) {
        const { invite, error, firstName } = await loadInvite(db, token);
        if (error) return res.status(LINK_ERRORS[error]).json({ error, firstName });
        return res.status(200).json({ mode: 'winner', firstName, budgetCents: invite.budget_cents, products: await loadProducts(db) });
      }
      const admin = await requireAdmin(req, res);
      if (!admin) return undefined;
      return res.status(200).json({ mode: 'admin', products: await loadProducts(db) });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const items = parseCart(body.items);
    if (!items) return res.status(400).json({ error: 'empty_cart' });
    const { ship, error: shipError } = parseShipping(body.shipping);
    if (shipError) return res.status(400).json({ error: 'bad_shipping', field: shipError });

    const token = body.token ? String(body.token) : null;
    let adminEmail = null;
    if (token) {
      if (!TOKEN_RE.test(token)) return res.status(404).json({ error: 'invalid_link' });
    } else {
      const admin = await requireAdmin(req, res);
      if (!admin) return undefined;
      adminEmail = admin.email;
    }

    const { data: result, error } = await db.rpc('giftbox_checkout', { p_token: token, p_admin: adminEmail, p_items: items, p_ship: ship });
    if (error) throw error;
    if (!result?.ok) {
      const status = LINK_ERRORS[result?.error] || (result?.error === 'forbidden' ? 403 : 409);
      return res.status(status).json(result || { error: 'checkout_failed' });
    }

    // Best effort: an email problem never undoes the order.
    let placedBy = adminEmail;
    let budgetCents = null;
    if (token) {
      const { data: inv } = await db.from('giftbox_invites').select('winner_name, budget_cents').eq('token', token).maybeSingle();
      placedBy = inv?.winner_name || ship.name;
      budgetCents = inv?.budget_cents || null;
    }
    await Promise.allSettled([
      sendTeamAlert(teamOrderEmail({ kind: token ? 'winner' : 'admin', placedBy, items: result.items, totalCents: result.totalCents, budgetCents, ship })),
      token ? sendCampaignEmail(ship.email, winnerConfirmationEmail({ name: ship.name, items: result.items, totalCents: result.totalCents })) : null,
    ]);
    return res.status(200).json({ ok: true, orderId: result.orderId, totalCents: result.totalCents, items: result.items });
  } catch (e) {
    console.error('[giftbox]', e?.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
}
