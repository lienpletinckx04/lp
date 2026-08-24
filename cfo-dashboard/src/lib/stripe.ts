import Stripe from "stripe";

let stripeClient: Stripe | null = null;

// Returns null (instead of throwing) when no key is configured, so the app
// keeps working with an empty state until Stripe is wired up.
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: "2024-06-20" });
  }
  return stripeClient;
}

// Maps a Stripe Price nickname/lookup_key/product name to our plan enum.
// TODO: adjust matching to your actual Stripe price naming once set up.
export function inferPlan(priceNickname: string | null | undefined): string {
  const n = (priceNickname ?? "").toLowerCase();
  if (n.includes("founder")) return "founder";
  if (n.includes("annual") || n.includes("jaar")) return "annual";
  return "regular";
}

// Maps a Stripe product/price description to our pijler enum.
// TODO: adjust matching to your actual Stripe product naming once set up.
export function inferPijler(description: string | null | undefined): string {
  const d = (description ?? "").toLowerCase();
  if (d.includes("voorsprong")) return "voorsprong";
  if (d.includes("audit")) return "audit";
  if (d.includes("traject")) return "traject";
  if (d.includes("retainer")) return "retainer";
  if (d.includes("workshop")) return "workshop";
  if (d.includes("challenge")) return "challenge";
  return "other";
}
