// Port of admin.ts — only readSurvivalConfig (admin POST/write removed).
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const CONFIG_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "survival-config.json");

const DEFAULT_CONFIG = {
  creditBalanceTril: 37.0,
  creditBalanceDate: "2026-05-29",
  creditBalanceNote: "금투협 신용잔고",
  foreignNetSellTril: -44.7,
  foreignNetSellDate: "2026-05-31",
  foreignNetSellNote: "거래소 외국인 순매도",
  updatedAt: new Date().toISOString(),
};

export function readSurvivalConfig() {
  try {
    if (!existsSync(CONFIG_PATH)) return DEFAULT_CONFIG;
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return DEFAULT_CONFIG;
  }
}
