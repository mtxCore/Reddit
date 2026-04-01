import { readFileSync, writeFileSync } from "@zos/fs";

const SETTINGS_PATH = "data://userdata/wrist_reddit_settings.json";

const DEFAULT_SETTINGS = {
  favorites: ["technology", "news", "funny", "gaming", "askreddit"],
  lastSubreddit: "technology",
  lastSort: "hot",
  postLimit: 15,
  showImages: true,
  fontSize: 22,
  commentLimit: 25,
};

export function loadSettings() {
  try {
    const raw = readFileSync({ path: SETTINGS_PATH, encoding: "utf8" });
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    writeFileSync({
      path: SETTINGS_PATH,
      data: JSON.stringify(settings),
      encoding: "utf8",
    });
  } catch (e) {
    // silently fail
  }
}

export function getGlobal() {
  return getApp()._options.globalData;
}
