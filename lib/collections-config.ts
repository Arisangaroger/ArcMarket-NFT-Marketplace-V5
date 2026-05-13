/**

 * ── DYNAMIC COLLECTIONS CONFIG ──────────────────────────────────────────────
 * Collections are now managed in your .env.local file.
 * The addresses below are parsed from NEXT_PUBLIC_COLLECTION_ADDRESSES.
 * ────────────────────────────────────────────────────────────────────────────
 */

const envAddresses = process.env.NEXT_PUBLIC_COLLECTION_ADDRESSES || "";
export const COLLECTION_ADDRESSES = envAddresses
  .split(",")
  .map((addr) => addr.trim())
  .filter((addr) => addr.startsWith("0x")) as `0x${string}`[];

