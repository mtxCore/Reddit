import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { back } from "@zos/router";
import { loadSettings, saveSettings, getGlobal } from "../utils/state";
import {
  ORANGE,
  BG,
  BG_CARD,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  MARGIN,
  SAFE_TOP,
} from "../utils/config/constants";

Page({
  build() {
    hmUI.setStatusBarVisible(false);
    const { width: W, height: H } = getDeviceInfo();
    const g = getGlobal();
    const edit = g.editSetting;
    const settings = loadSettings();

    if (!edit) {
      back();
      return;
    }

    const CW = W - MARGIN * 2;
    const OPT_H = 64;
    let y = SAFE_TOP;
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: MARGIN,
      y: y,
      w: CW,
      h: 30,
      text: edit.title.toUpperCase(),
      color: TEXT_MUTED,
      text_size: 16,
      align_h: hmUI.align.CENTER_H,
    });
    y += 44;

    for (const opt of edit.options) {
      const optStr = String(opt);
      const isSelected = optStr === String(edit.current);

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN,
        y: y,
        w: CW,
        h: OPT_H - 4,
        color: isSelected ? ORANGE : BG_CARD,
        radius: 14,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN,
        y: y,
        w: CW,
        h: OPT_H - 4,
        text: optStr,
        color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY,
        text_size: 22,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      });

      const hit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN,
        y: y,
        w: CW,
        h: OPT_H - 4,
        color: 0xffffff,
        alpha: 0,
      });
      hit.addEventListener(hmUI.event.CLICK_UP, () => {
        // Apply the setting
        if (edit.key === "showImages") {
          settings[edit.key] = opt === "On";
        } else {
          settings[edit.key] = opt;
        }
        saveSettings(settings);
        g.settingsChanged = true;
        back();
      });

      y += OPT_H;
    }

    y += 20;
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
});
