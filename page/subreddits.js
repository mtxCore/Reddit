import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { push, back } from "@zos/router";
import { createKeyboard, deleteKeyboard, inputType } from "@zos/ui";
import { loadSettings, saveSettings, getGlobal } from "../utils/state";
import {
  ORANGE,
  BG,
  BG_CARD,
  BG_ELEVATED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  DIVIDER,
  BLUE_ACCENT,
  MARGIN,
  CARD_RADIUS,
  BTN_RADIUS,
  ITEM_H,
  SORT_OPTIONS,
  SAFE_TOP,
  SAFE_BOTTOM,
} from "../utils/config/constants";

Page({
  state: {
    settings: null,
  },

  onInit() {
    this.state.settings = loadSettings();
  },

  build() {
    hmUI.setStatusBarVisible(false);
    const { width: W, height: H } = getDeviceInfo();
    const g = getGlobal();
    const settings = this.state.settings;
    const favorites = settings.favorites;
    const CW = W - MARGIN * 2;

    let y = SAFE_TOP;

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: y,
      w: W,
      h: 36,
      text: "Subreddits",
      color: TEXT_PRIMARY,
      text_size: 24,
      align_h: hmUI.align.CENTER_H,
    });
    y += 44;

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 44,
      color: BG_ELEVATED,
      radius: BTN_RADIUS,
    });
    const sortLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: MARGIN + 14,
      y: y,
      w: CW - 28,
      h: 44,
      text: `Sort: ${g.currentSort.toUpperCase()}`,
      color: TEXT_SECONDARY,
      text_size: 18,
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.CENTER_V,
    });
    const sortHit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 44,
      color: 0xffffff,
      alpha: 0,
    });
    sortHit.addEventListener(hmUI.event.CLICK_UP, () => {
      const idx = SORT_OPTIONS.indexOf(g.currentSort);
      g.currentSort = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
      sortLabel.setProperty(
        hmUI.prop.TEXT,
        `Sort: ${g.currentSort.toUpperCase()}`,
      );
      settings.lastSort = g.currentSort;
      saveSettings(settings);
      g.needsRefresh = true;
    });
    y += 54;

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: MARGIN + 20,
      y: y,
      w: CW - 40,
      h: 1,
      color: DIVIDER,
    });
    y += 12;

    for (let i = 0; i < favorites.length; i++) {
      const sub = favorites[i];
      const isCurrent = sub === g.currentSubreddit;

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN,
        y: y,
        w: CW,
        h: ITEM_H - 4,
        color: isCurrent ? ORANGE : BG_CARD,
        radius: BTN_RADIUS,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + 14,
        y: y,
        w: CW - 40,
        h: ITEM_H - 4,
        text: `r/${sub}`,
        color: isCurrent ? TEXT_PRIMARY : TEXT_SECONDARY,
        text_size: 20,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
      });

      if (isCurrent) {
        hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: MARGIN + CW - 26,
          y: y + (ITEM_H - 4) / 2 - 4,
          w: 8,
          h: 8,
          color: TEXT_PRIMARY,
          radius: 4,
        });
      }

      const hit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN,
        y: y,
        w: CW,
        h: ITEM_H - 4,
        color: 0xffffff,
        alpha: 0,
      });
      hit.addEventListener(hmUI.event.CLICK_UP, () => {
        g.currentSubreddit = sub;
        g.needsRefresh = true;
        settings.lastSubreddit = sub;
        saveSettings(settings);
        back();
      });

      y += ITEM_H;
    }

    y += 12;

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 52,
      color: BLUE_ACCENT,
      radius: BTN_RADIUS,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 52,
      text: "+  Add Subreddit",
      color: TEXT_PRIMARY,
      text_size: 18,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });
    const addHit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 52,
      color: 0xffffff,
      alpha: 0,
    });
    addHit.addEventListener(hmUI.event.CLICK_UP, () => {
      createKeyboard({
        inputType: inputType.CHAR,
        text: "",
        onComplete: (kb, res) => {
          deleteKeyboard();
          const val = res.data
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "");
          if (val && !settings.favorites.includes(val)) {
            settings.favorites.push(val);
            saveSettings(settings);

            g.currentSubreddit = val;
            g.needsRefresh = true;
            settings.lastSubreddit = val;
            saveSettings(settings);
            back();
          }
        },
      });
    });
    y += 62;

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 52,
      color: BG_ELEVATED,
      radius: BTN_RADIUS,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 52,
      text: "Settings",
      color: TEXT_SECONDARY,
      text_size: 18,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });
    const setHit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 52,
      color: 0xffffff,
      alpha: 0,
    });
    setHit.addEventListener(hmUI.event.CLICK_UP, () => {
      push({ url: "page/settings" });
    });
    y += 62;

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: y + 8,
      w: W,
      h: 30,
      text: "← swipe to go back",
      color: TEXT_MUTED,
      text_size: 13,
      align_h: hmUI.align.CENTER_H,
    });
  },
});
