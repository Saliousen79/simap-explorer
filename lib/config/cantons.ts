import { CantonCode } from "@/lib/agents/types";

export interface CantonDefinition {
  code: CantonCode;
  name: string;
  aliases: string[];
  x: number;
  y: number;
}

export const CANTONS: CantonDefinition[] = [
  { code: "GE", name: "Genf", aliases: ["genf", "geneve", "genève"], x: 34, y: 246 },
  { code: "VD", name: "Waadt", aliases: ["waadt", "vaud"], x: 92, y: 198 },
  { code: "VS", name: "Wallis", aliases: ["wallis", "valais"], x: 164, y: 246 },
  { code: "NE", name: "Neuenburg", aliases: ["neuenburg", "neuchatel", "neuchâtel"], x: 102, y: 144 },
  { code: "JU", name: "Jura", aliases: ["jura"], x: 108, y: 88 },
  { code: "FR", name: "Freiburg", aliases: ["freiburg", "fribourg"], x: 150, y: 172 },
  { code: "BE", name: "Bern", aliases: ["bern", "berne"], x: 204, y: 160 },
  { code: "SO", name: "Solothurn", aliases: ["solothurn", "soleure"], x: 204, y: 98 },
  { code: "BS", name: "Basel-Stadt", aliases: ["basel stadt", "baselstadt"], x: 174, y: 46 },
  { code: "BL", name: "Basel-Landschaft", aliases: ["basel landschaft", "basel land", "baselland"], x: 205, y: 65 },
  { code: "AG", name: "Aargau", aliases: ["aargau", "argovie"], x: 258, y: 82 },
  { code: "LU", name: "Luzern", aliases: ["luzern", "lucerne"], x: 260, y: 142 },
  { code: "OW", name: "Obwalden", aliases: ["obwalden"], x: 248, y: 192 },
  { code: "NW", name: "Nidwalden", aliases: ["nidwalden"], x: 286, y: 178 },
  { code: "UR", name: "Uri", aliases: ["uri"], x: 300, y: 222 },
  { code: "ZG", name: "Zug", aliases: ["zug", "zoug"], x: 306, y: 130 },
  { code: "ZH", name: "Zürich", aliases: ["zürich", "zurich", "zuerich"], x: 348, y: 92 },
  { code: "SH", name: "Schaffhausen", aliases: ["schaffhausen"], x: 340, y: 32 },
  { code: "TG", name: "Thurgau", aliases: ["thurgau", "thurgovie"], x: 408, y: 72 },
  { code: "SG", name: "St. Gallen", aliases: ["st gallen", "sankt gallen", "saint gall"], x: 430, y: 128 },
  { code: "AR", name: "Appenzell Ausserrhoden", aliases: ["appenzell ausserrhoden", "appenzell außerrhoden"], x: 438, y: 104 },
  { code: "AI", name: "Appenzell Innerrhoden", aliases: ["appenzell innerrhoden"], x: 455, y: 132 },
  { code: "GL", name: "Glarus", aliases: ["glarus", "glaris"], x: 374, y: 176 },
  { code: "SZ", name: "Schwyz", aliases: ["schwyz", "schwytz"], x: 334, y: 158 },
  { code: "GR", name: "Graubünden", aliases: ["graubünden", "graubunden", "grisons"], x: 426, y: 218 },
  { code: "TI", name: "Tessin", aliases: ["tessin", "ticino"], x: 340, y: 274 }
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function extractMentionedCantons(prompt: string): CantonCode[] {
  const normalized = ` ${normalize(prompt)} `;
  const explicitCodes = new Set(prompt.match(/\b[A-Z]{2}\b/g) ?? []);
  return CANTONS.filter((canton) =>
    explicitCodes.has(canton.code) || canton.aliases.some((alias) => normalized.includes(` ${normalize(alias)} `))
  ).map((canton) => canton.code);
}

export function cantonNames(codes: CantonCode[]) {
  return codes.map((code) => CANTONS.find((canton) => canton.code === code)?.name ?? code);
}
