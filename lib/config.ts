const productie = process.env.NODE_ENV === "production";

/**
 * Zonder Vercel Blob draait de app op de startdata in het geheugen. Handig om lokaal de opmaak te bekijken.
 * Vercel koppelt een store tegenwoordig via OIDC (BLOB_STORE_ID); oudere koppelingen geven BLOB_READ_WRITE_TOKEN.
 */
export const isDemo = !process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN;

/** Wachtwoord voor het hele team, ingesteld als env-var in Vercel */
export const wachtwoord = process.env.APP_WACHTWOORD ?? "";

/** In productie moet er een wachtwoord zijn; lokaal mag de app zonder */
export const wachtwoordOntbreekt = !wachtwoord && productie;

/** Pincode voor het beheer. Lokaal zonder env-var is het 1234; in productie zonder pincode is het beheer dicht. */
export const pincode = (process.env.BEHEER_PINCODE ?? "").trim() || (productie ? "" : "1234");
