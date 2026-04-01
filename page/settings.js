import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { push } from "@zos/router";
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
  ERROR_RED,
  BLUE_ACCENT,
  MARGIN,
  BTN_RADIUS,
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
    const CW = W - MARGIN * 2;
    const ROW_H = 56;

    let y = SAFE_TOP;

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: y,
      w: W,
      h: 36,
      text: "Settings",
      color: TEXT_PRIMARY,
      text_size: 24,
      align_h: hmUI.align.CENTER_H,
    });
    y += 48;

    const addRow = (label, value, onTap) => {
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN,
        y: y,
        w: CW,
        h: ROW_H,
        color: BG_CARD,
        radius: 10,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + 14,
        y: y,
        w: CW * 0.55,
        h: ROW_H,
        text: label,
        color: TEXT_SECONDARY,
        text_size: 18,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + Math.floor(CW * 0.55),
        y: y,
        w: Math.floor(CW * 0.4),
        h: ROW_H,
        text: value,
        color: ORANGE,
        text_size: 18,
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
      });
      const hit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN,
        y: y,
        w: CW,
        h: ROW_H,
        color: 0xffffff,
        alpha: 0,
      });
      hit.addEventListener(hmUI.event.CLICK_UP, onTap);
      y += ROW_H + 6;
    };

    addRow("Posts to load", `${settings.postLimit}`, () => {
      this._openDetail(
        "postLimit",
        "Posts to Load",
        [10, 15, 25],
        settings.postLimit,
      );
    });

    addRow("Comments", `${settings.commentLimit}`, () => {
      this._openDetail(
        "commentLimit",
        "Comments",
        [10, 25, 50, 100],
        settings.commentLimit,
      );
    });

    addRow("Font size", `${settings.fontSize}`, () => {
      this._openDetail(
        "fontSize",
        "Font Size",
        [18, 22, 26],
        settings.fontSize,
      );
    });

    addRow("Images", settings.showImages ? "On" : "Off", () => {
      this._openDetail(
        "showImages",
        "Load Images",
        ["On", "Off"],
        settings.showImages ? "On" : "Off",
      );
    });

    y += 10;

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: MARGIN + 6,
      y: y,
      w: CW,
      h: 24,
      text: "MANAGE SUBREDDITS",
      color: TEXT_MUTED,
      text_size: 14,
    });
    y += 30;

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 48,
      color: BLUE_ACCENT,
      radius: 10,
    });
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 48,
      text: "+  Add Subreddit",
      color: TEXT_PRIMARY,
      text_size: 17,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });
    const addHit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 48,
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
            g.settingsChanged = true;
          }
        },
      });
    });
    y += 56;

    for (const sub of settings.favorites) {
      const rowY = y;

      const bg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN,
        y: rowY,
        w: CW,
        h: 48,
        color: BG_CARD,
        radius: 8,
      });

      const label = hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + 12,
        y: rowY,
        w: CW - 50,
        h: 48,
        text: `r/${sub}`,
        color: TEXT_SECONDARY,
        text_size: 17,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
      });

      const removeIcon = hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + CW - 40,
        y: rowY,
        w: 30,
        h: 48,
        text: "×",
        color: ERROR_RED,
        text_size: 22,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      });

      const hit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN,
        y: rowY,
        w: CW,
        h: 48,
        color: 0xffffff,
        alpha: 0,
      });
      hit.addEventListener(hmUI.event.CLICK_UP, () => {
        settings.favorites = settings.favorites.filter((f) => f !== sub);
        saveSettings(settings);
        g.settingsChanged = true;

        try {
          bg.setProperty(hmUI.prop.MORE, {
            x: MARGIN,
            y: rowY,
            w: CW,
            h: 48,
            color: 0x1a0000,
            radius: 8,
          });
        } catch (e) {}
        label.setProperty(hmUI.prop.TEXT, `r/${sub} removed`);
        label.setProperty(hmUI.prop.COLOR, TEXT_MUTED);
        removeIcon.setProperty(hmUI.prop.VISIBLE, false);
        hit.setProperty(hmUI.prop.VISIBLE, false);
      });

      y += 54;
    }

    y += 10;

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: y,
      w: W,
      h: 30,
      text: "← swipe to go back",
      color: TEXT_MUTED,
      text_size: 13,
      align_h: hmUI.align.CENTER_H,
    });
  },

  _openDetail(key, title, options, current) {
    const g = getGlobal();
    g.editSetting = { key, title, options, current };
    push({ url: "page/settingsDetail" });
  },
});
