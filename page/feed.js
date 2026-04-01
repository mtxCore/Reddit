import * as hmUI from "@zos/ui";
import { BasePage } from "@zeppos/zml/base-page";
import { getDeviceInfo } from "@zos/device";
import { push } from "@zos/router";
import {
  onGesture,
  GESTURE_LEFT,
  GESTURE_RIGHT,
  GESTURE_UP,
  GESTURE_DOWN,
} from "@zos/interaction";
import { loadSettings, saveSettings, getGlobal } from "../utils/state";
import { formatNum, timeAgo, decodeEntities } from "../utils/helpers";
import {
  ORANGE,
  BG,
  BG_CARD,
  BG_ELEVATED,
  BG_BUTTON,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_MUTED,
  ERROR_RED,
  MARGIN,
  CARD_RADIUS,
  HEADER_H,
  FOOTER_H,
  IMG_H,
  SORT_OPTIONS,
  SAFE_TOP,
  SAFE_BOTTOM,
} from "../utils/config/constants";

Page(
  BasePage({
    state: {
      settings: null,
    },

    onInit() {
      this.state.settings = loadSettings();
      const g = getGlobal();
      if (!g.initialized) {
        g.currentSubreddit = this.state.settings.lastSubreddit || "technology";
        g.currentSort = this.state.settings.lastSort || "hot";
        g.initialized = true;
      }
    },

    onReceivedFile(file) {
      const g = getGlobal();
      const capturedGen = g.pendingImageGeneration;

      file.on("change", (event) => {
        if (event.data.readyState !== "transferred") return;

        const params = file.params;
        const postId =
          params && typeof params === "object" ? params.postId : params;

        if (postId) {
          g.imageCache[postId] = file.filePath;
        }

        if (capturedGen !== g.pendingImageGeneration) return;

        const currentPost = g.posts[g.currentIndex];
        const isCurrent = currentPost && currentPost.id === postId;
        const shouldShow =
          g.pendingImagePostId === postId ||
          (g.pendingImagePostId === null && isCurrent);

        if (shouldShow) {
          if (this._imgTimeout) {
            clearTimeout(this._imgTimeout);
            this._imgTimeout = null;
          }
          g.pendingImagePostId = null;
          this._showImage(file.filePath);
        }
      });
    },

    onCall(req) {
      if (req.method === "IMAGE_FAILED") {
        const g = getGlobal();
        const { postId, error } = req.params;
        if (postId === g.pendingImagePostId) {
          if (this._imgTimeout) {
            clearTimeout(this._imgTimeout);
            this._imgTimeout = null;
          }
          g.pendingImagePostId = null;
          this._setImageStatus(error || "Failed", ERROR_RED);
        }
      }
    },

    build() {
      hmUI.setStatusBarVisible(false);
      const { width: W, height: H } = getDeviceInfo();
      this._W = W;
      this._H = H;
      const g = getGlobal();

      const CARD_Y = SAFE_TOP + HEADER_H + 6;
      const CARD_W = W - MARGIN * 2;
      const CARD_H = H - SAFE_TOP - HEADER_H - FOOTER_H - SAFE_BOTTOM - 12;
      this._CARD_Y = CARD_Y;
      this._CARD_W = CARD_W;
      this._CARD_H = CARD_H;

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: W,
        h: H,
        color: BG,
      });

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: W,
        h: SAFE_TOP + HEADER_H,
        color: BG_ELEVATED,
      });

      this._subText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 24,
        y: SAFE_TOP + 10,
        w: W - 120,
        h: 30,
        text: `r/${g.currentSubreddit}`,
        color: ORANGE,
        text_size: 24,
        align_h: hmUI.align.LEFT,
      });

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: W - 92,
        y: SAFE_TOP + 12,
        w: 68,
        h: 28,
        color: BG_BUTTON,
        radius: 14,
      });
      this._sortText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: W - 92,
        y: SAFE_TOP + 12,
        w: 68,
        h: 28,
        text: g.currentSort.toUpperCase(),
        color: TEXT_SECONDARY,
        text_size: 14,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      });

      this._subHint = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 24,
        y: SAFE_TOP + 44,
        w: W - 48,
        h: 22,
        text: "",
        color: TEXT_MUTED,
        text_size: 14,
        align_h: hmUI.align.LEFT,
      });

      const subHit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: W - 90,
        h: SAFE_TOP + HEADER_H,
        color: 0xffffff,
        alpha: 0,
      });
      subHit.addEventListener(hmUI.event.CLICK_UP, () => {
        push({ url: "page/subreddits" });
      });

      const sortHit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: W - 90,
        y: 0,
        w: 90,
        h: SAFE_TOP + HEADER_H,
        color: 0xffffff,
        alpha: 0,
      });
      sortHit.addEventListener(hmUI.event.CLICK_UP, () => this._cycleSort());

      this._cardBg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN,
        y: CARD_Y,
        w: CARD_W,
        h: CARD_H,
        color: BG_CARD,
        radius: CARD_RADIUS,
      });
      this._cardBg.addEventListener(hmUI.event.CLICK_UP, () => {
        if (g.posts.length) this._openComments();
      });

      this._thumbImg = hmUI.createWidget(hmUI.widget.IMG, {
        x: MARGIN,
        y: CARD_Y,
        w: CARD_W,
        h: IMG_H,
        auto_scale: true,
        src: "",
      });
      this._thumbImg.setProperty(hmUI.prop.VISIBLE, false);

      this._thumbLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN,
        y: CARD_Y,
        w: CARD_W,
        h: IMG_H,
        text: "",
        color: TEXT_MUTED,
        text_size: 16,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      });
      this._thumbLabel.setProperty(hmUI.prop.VISIBLE, false);

      this._title = hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + 10,
        y: CARD_Y + 10,
        w: CARD_W - 20,
        h: CARD_H - 56,
        text: "Loading…",
        color: TEXT_PRIMARY,
        text_size: this.state.settings.fontSize,
        text_style: hmUI.text_style.WRAP,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.TOP,
      });
      this._title.addEventListener(hmUI.event.CLICK_UP, () => {
        if (g.posts.length) this._openComments();
      });

      this._meta = hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + 10,
        y: CARD_Y + CARD_H - 44,
        w: CARD_W - 20,
        h: 20,
        text: "",
        color: TEXT_TERTIARY,
        text_size: 15,
        align_h: hmUI.align.LEFT,
      });

      this._commentHint = hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + 10,
        y: CARD_Y + CARD_H - 24,
        w: CARD_W - 20,
        h: 18,
        text: "",
        color: TEXT_MUTED,
        text_size: 13,
        align_h: hmUI.align.LEFT,
      });

      this._footer = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: H - FOOTER_H - SAFE_BOTTOM,
        w: W,
        h: FOOTER_H,
        text: "",
        color: TEXT_SECONDARY,
        text_size: 17,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      });

      this._setupGestures();

      if (!g.posts.length || g.needsRefresh) {
        g.needsRefresh = false;
        this._fetchPosts();
      } else {
        this._updateCard();
      }
    },

    onShow() {
      const g = getGlobal();
      this.state.settings = loadSettings();

      if (this._subText) {
        this._subText.setProperty(hmUI.prop.TEXT, `r/${g.currentSubreddit}`);
        this._sortText.setProperty(hmUI.prop.TEXT, g.currentSort.toUpperCase());
      }

      if (g.needsRefresh) {
        g.needsRefresh = false;
        this._fetchPosts();
      } else if (g.settingsChanged) {
        g.settingsChanged = false;
        if (g.posts.length) this._updateCard();
      }
    },

    _setupGestures() {
      onGesture({
        callback: (event) => {
          const g = getGlobal();

          if (g.needsRefresh) {
            g.needsRefresh = false;
            this._fetchPosts();
            return true;
          }

          if (event === GESTURE_LEFT) {
            this._changePost(1);
          } else if (event === GESTURE_RIGHT) {
            this._changePost(-1);
          } else if (event === GESTURE_UP) {
            if (g.posts.length) this._openComments();
          } else if (event === GESTURE_DOWN) {
            this._fetchPosts();
          }
          return true;
        },
      });
    },

    _cycleSort() {
      const g = getGlobal();
      const idx = SORT_OPTIONS.indexOf(g.currentSort);
      g.currentSort = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
      this._sortText.setProperty(hmUI.prop.TEXT, g.currentSort.toUpperCase());
      this.state.settings.lastSort = g.currentSort;
      saveSettings(this.state.settings);
      this._fetchPosts();
    },

    _fetchPosts() {
      const g = getGlobal();

      this._title.setProperty(hmUI.prop.TEXT, "Loading…");
      this._meta.setProperty(hmUI.prop.TEXT, "");
      this._commentHint.setProperty(hmUI.prop.TEXT, "");
      this._footer.setProperty(hmUI.prop.TEXT, "");
      this._subHint.setProperty(hmUI.prop.TEXT, "Fetching posts…");
      this._hideImage();

      g.imageCache = {};
      g.pendingImageGeneration++;
      if (this._imgTimeout) {
        clearTimeout(this._imgTimeout);
        this._imgTimeout = null;
      }

      this.request({
        method: "GET_REDDIT",
        params: {
          subreddit: g.currentSubreddit,
          sort: g.currentSort,
          limit: this.state.settings.postLimit,
        },
      })
        .then((data) => {
          if (!data || !data.result || typeof data.result === "string") {
            this._title.setProperty(
              hmUI.prop.TEXT,
              "Failed to load.\nSwipe down to retry.",
            );
            this._subHint.setProperty(hmUI.prop.TEXT, "");
            return;
          }
          this._hideImage();
          g.posts = data.result;
          g.currentIndex = 0;

          this.state.settings.lastSubreddit = g.currentSubreddit;
          saveSettings(this.state.settings);

          this._updateCard();
        })
        .catch(() => {
          this._title.setProperty(
            hmUI.prop.TEXT,
            "Connection error.\nCheck Bluetooth.\nSwipe down to retry.",
          );
          this._subHint.setProperty(hmUI.prop.TEXT, "");
        });
    },

    _updateCard() {
      const g = getGlobal();
      if (!g.posts.length) return;

      const post = g.posts[g.currentIndex];
      const settings = this.state.settings;

      const hasImage = post.imageUrl && settings.showImages;
      const titleY = hasImage ? this._CARD_Y + IMG_H + 6 : this._CARD_Y + 10;
      const metaY = this._CARD_Y + this._CARD_H - 44;

      this._title.setProperty(hmUI.prop.Y, titleY);
      this._title.setProperty(hmUI.prop.H, metaY - titleY - 4);
      this._title.setProperty(hmUI.prop.TEXT, decodeEntities(post.title));
      this._title.setProperty(hmUI.prop.TEXT_SIZE, settings.fontSize);

      const parts = [];
      if (post.author) parts.push(`u/${post.author}`);
      if (post.created_utc) parts.push(timeAgo(post.created_utc));
      this._meta.setProperty(hmUI.prop.TEXT, parts.join("  ·  "));

      const cCount =
        post.num_comments !== undefined
          ? `${formatNum(post.num_comments)} comments`
          : "";
      this._commentHint.setProperty(
        hmUI.prop.TEXT,
        cCount ? `${cCount} · tap to read` : "Tap to read",
      );

      this._footer.setProperty(
        hmUI.prop.TEXT,
        `${g.currentIndex + 1}/${g.posts.length} · ${g.currentSort.toUpperCase()} · ▲${formatNum(post.ups)}`,
      );

      this._subHint.setProperty(
        hmUI.prop.TEXT,
        `${g.posts.length} posts loaded`,
      );

      if (hasImage) {
        const cached = g.imageCache[post.id];
        if (cached) {
          this._showImage(cached);
        } else if (g.pendingImagePostId === post.id) {
          this._setImageStatus("Downloading…", TEXT_MUTED);
        } else {
          this._requestImage(post);
        }
      } else {
        this._hideImage();
      }
    },

    _changePost(dir) {
      const g = getGlobal();
      if (!g.posts.length) return;

      if (this._imgTimeout) {
        clearTimeout(this._imgTimeout);
        this._imgTimeout = null;
      }
      g.pendingImageGeneration++;
      g.pendingImagePostId = null;
      this._hideImage();

      g.currentIndex = (g.currentIndex + dir + g.posts.length) % g.posts.length;
      this._updateCard();
    },

    _openComments() {
      push({ url: "page/comments" });
    },

    _requestImage(post) {
      const g = getGlobal();
      g.pendingImagePostId = post.id;
      this._setImageStatus("Loading image…", TEXT_MUTED);

      this.request({
        method: "FETCH_IMAGE",
        params: { url: post.imageUrl, postId: post.id },
      })
        .then((data) => {
          if (g.pendingImagePostId !== post.id) return;

          if (data && data.result === "TRANSFER_STARTED") {
            this._setImageStatus("Downloading…", TEXT_MUTED);

            if (this._imgTimeout) clearTimeout(this._imgTimeout);
            this._imgTimeout = setTimeout(() => {
              if (g.pendingImagePostId === post.id) {
                g.pendingImagePostId = null;
                this._setImageStatus("Timed out", ERROR_RED);
              }
            }, 30000);
          } else {
            this._setImageStatus("Failed", ERROR_RED);
          }
        })
        .catch(() => {
          if (g.pendingImagePostId === post.id) {
            this._setImageStatus("Connection error", ERROR_RED);
          }
        });
    },

    _showImage(path) {
      try {
        this._thumbLabel.setProperty(hmUI.prop.VISIBLE, false);
        this._thumbImg.setProperty(hmUI.prop.MORE, {
          x: MARGIN,
          y: this._CARD_Y,
          w: this._CARD_W,
          h: IMG_H,
          auto_scale: true,
          src: path,
        });
        this._thumbImg.setProperty(hmUI.prop.VISIBLE, true);
        this._title.setProperty(hmUI.prop.Y, this._CARD_Y + IMG_H + 6);
      } catch (e) {
        this._hideImage();
      }
    },

    _setImageStatus(text, color) {
      this._thumbImg.setProperty(hmUI.prop.VISIBLE, false);
      this._thumbLabel.setProperty(hmUI.prop.TEXT, text);
      this._thumbLabel.setProperty(hmUI.prop.COLOR, color);
      this._thumbLabel.setProperty(hmUI.prop.VISIBLE, true);
    },

    _hideImage() {
      if (this._thumbImg) {
        try {
          this._thumbImg.setProperty(hmUI.prop.MORE, {
            x: MARGIN,
            y: this._CARD_Y,
            w: this._CARD_W,
            h: IMG_H,
            src: "",
          });
        } catch (e) {}
        this._thumbImg.setProperty(hmUI.prop.VISIBLE, false);
      }
      if (this._thumbLabel) {
        this._thumbLabel.setProperty(hmUI.prop.VISIBLE, false);
      }
    },
  }),
);
