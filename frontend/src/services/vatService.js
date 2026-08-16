/**
 * Central VAT service — single frontend source of truth for tax calculation.
 *
 * Reads the central VAT configuration (/vat-config) and the per-product tax
 * mapping catalog (/vat-config/mappings/catalog). Every module form uses this
 * so the whole ERP calculates VAT from one place. Rates are never hard-coded.
 */
import apiClient from './apiClient';

let cache = null;
let inflight = null;

/** Load (and cache) the central VAT config + product mapping catalog. */
export const loadVat = async (force) => {
  if (cache && !force) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const [configsRes, catalogRes] = await Promise.all([
        apiClient.get('/vat-config'),
        apiClient.get('/vat-config/mappings/catalog'),
      ]);

      const configs = Array.isArray(configsRes)
        ? configsRes
        : (configsRes?.data?.data ?? configsRes?.data ?? []);

      const catalogData = catalogRes?.data?.data ?? catalogRes?.data ?? catalogRes;
      const categories = Array.isArray(catalogData) ? catalogData : (catalogData?.categories || []);

      const byTreatment = {};
      (Array.isArray(configs) ? configs : []).forEach((c) => {
        byTreatment[c.treatment] = c;
      });

      // key: `${source}:${itemId}` -> { treatment, rate, vat_config_id }
      const byItem = {};
      const bySourceDefault = {};
      (Array.isArray(categories) ? categories : []).forEach((cat) => {
        const sections = cat.subsections || [{ key: cat.key, items: cat.items }];
        sections.forEach((s) => {
          (s.items || []).forEach((it) => {
            if (it.mapping) {
              byItem[`${s.key}:${it.id}`] = it.mapping;
              if (!bySourceDefault[s.key]) bySourceDefault[s.key] = it.mapping;
            }
          });
        });
      });

      cache = { configs, byTreatment, byItem, bySourceDefault, categories, loadedAt: Date.now() };
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
};

/** Best-effort load — never throws; returns null on failure. */
export const loadVatSafe = async () => {
  try {
    return await loadVat();
  } catch {
    return null;
  }
};

/**
 * VAT breakdown for a single product line.
 * @param ctx VAT context from loadVat()
 * @param source mapping source (printing | pharmacy | car_rental | agrirent | retail | tender_sell | tender_buy)
 * @param itemId the product id inside that source
 * @param amount base amount (unit price, or line subtotal = price * qty)
 * @param fallbackRate rate used when the item has no CEO mapping (e.g. a drug's own vat_rate). Defaults to standard.
 */
export const getVatForItem = (ctx, source, itemId, amount, fallbackRate) => {
  const mapping = itemId != null ? (ctx?.byItem?.[`${source}:${itemId}`] || null) : null;
  const treatmentKey = mapping?.treatment || 'standard';
  const cfg = ctx?.byTreatment?.[treatmentKey] || ctx?.byTreatment?.standard || null;
  const rate = mapping
    ? (cfg ? parseFloat(cfg.rate) : 0.15)
    : (fallbackRate != null ? (parseFloat(fallbackRate) || 0) : (cfg ? parseFloat(cfg.rate) : 0.15));
  const sub = Number(amount) || 0;
  const vat = sub * rate;
  return {
    mapped: !!mapping,
    treatment: mapping ? (cfg?.treatment || treatmentKey) : 'unmapped',
    rate,
    sub,
    vat,
    total: sub + vat,
    config: cfg || null,
  };
};

/** Aggregate VAT over a cart of items for a single source. */
export const calcCartVat = (ctx, source, items, priceKey = 'price', qtyKey = 'qty', getFallback) => {
  let subtotal = 0;
  let vat = 0;
  (items || []).forEach((it) => {
    const p = Number(it[priceKey]) || 0;
    const q = Number(it[qtyKey]) || 0;
    const fallback = typeof getFallback === 'function' ? getFallback(it) : undefined;
    const r = getVatForItem(ctx, source, it.id != null ? it.id : it.item_id, p * q, fallback);
    subtotal += r.sub;
    vat += r.vat;
  });
  return { subtotal, vat, total: subtotal + vat };
};

export const fmtMoney = (n) =>
  `ETB ${(Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export const fmtPct = (rate) =>
  `${((parseFloat(rate) || 0) * 100).toFixed(2).replace(/\.00$/, '')}%`;

/** Rate as an integer percentage (e.g. 0.15 -> 15). */
export const rateToPercent = (rate) => Math.round((parseFloat(rate) || 0) * 100);
