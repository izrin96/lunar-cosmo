import { env } from "@/env";
import { ValidObjekt } from "./universal/objekts";

export const GRID_COLUMNS = 7;
export const GRID_COLUMNS_MOBILE = 3;

export const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
export const SPIN_ADDRESS = "0xd3d5f29881ad87bb10c1100e2c709c9596de345f";

export const overrideAccents: Record<string, string> = {
  "Divine01 SeoYeon 117Z": "#B400FF",
  "Divine01 SeoYeon 118Z": "#B400FF",
  "Divine01 SeoYeon 119Z": "#B400FF",
  "Divine01 SeoYeon 120Z": "#B400FF",
  "Divine01 SeoYeon 317Z": "#df2e37",
  "Binary01 Choerry 201Z": "#FFFFFF",
  "Binary01 Choerry 202Z": "#FFFFFF",
};

export const overrideFonts: Record<string, string> = {
  "Atom01 HeeJin 322Z": "#FFFFFF",
  "Atom01 HeeJin 323Z": "#FFFFFF",
  "Atom01 HeeJin 324Z": "#FFFFFF",
  "Atom01 HeeJin 325Z": "#FFFFFF",
  "Ever01 SeoYeon 338Z": "#07328D",
};

export function getEdition(collectionNo: string) {
  const collection = parseInt(collectionNo);

  if (collection >= 101 && collection <= 108) {
    return "1st";
  }
  if (collection >= 109 && collection <= 116) {
    return "2nd";
  }
  if (collection >= 117 && collection <= 120) {
    return "3rd";
  }
  return null;
}

export function overrideColor(objekt: ValidObjekt) {
  // temporary fix accent color for some collection
  const accentColor = overrideAccents[objekt.collectionId];
  const fontColor = overrideFonts[objekt.collectionId];

  return {
    backgroundColor: accentColor ?? objekt.backgroundColor,
    accentColor: accentColor ?? objekt.accentColor,
    textColor: fontColor ?? objekt.textColor,
  };
}

export function getBaseURL() {
  if (env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
