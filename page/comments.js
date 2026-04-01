import * as hmUI from "@zos/ui";
import { BasePage } from "@zeppos/zml/base-page";
import { getDeviceInfo } from "@zos/device";
import { loadSettings, getGlobal } from "../utils/state";
import {
  formatNum,
  timeAgo,
  decodeEntities,
  measureTextHeight,
} from "../utils/helpers";
import {
  ORANGE,
  BG,
  BG_CARD,
  BG_BUTTON,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_MUTED,
  ERROR_RED,
  DIVIDER,
  MARGIN,
  CARD_RADIUS,
  SAFE_TOP,
  SAFE_BOTTOM,
} from "../utils/config/constants";

Page(
  BasePage({
    state: {
      afterToken: null,
      allComments: [],
      yOffset: 0,
      loadMoreWidgets: [],
      isLoading: false,
    },

    build() {
      hmUI.setStatusBarVisible(false);
      const { width: W, height: H } = getDeviceInfo();
      this._W = W;
      this._H = H;

      const g = getGlobal();
      const settings = loadSettings();
      this._settings = settings;
      const post = g.posts[g.currentIndex];
      this._post = post;

      if (!post) {
        hmUI.createWidget(hmUI.widget.TEXT, {
          x: MARGIN,
          y: H / 2 - 30,
          w: W - MARGIN * 2,
          h: 60,
          text: "No post selected",
          color: TEXT_SECONDARY,
          text_size: 20,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
        });
        return;
      }

      const CW = W - MARGIN * 2;
      this._CW = CW;
      let y = SAFE_TOP + 10;

      // ── Post title card ──
      const titleText = decodeEntities(post.title);
      const titleH = measureTextHeight(
        hmUI,
        titleText,
        settings.fontSize + 2,
        CW - 20,
      );

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN,
        y: y,
        w: CW,
        h: titleH + 20,
        color: BG_CARD,
        radius: CARD_RADIUS,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + 10,
        y: y + 10,
        w: CW - 20,
        h: titleH,
        text: titleText,
        color: TEXT_PRIMARY,
        text_size: settings.fontSize + 2,
        text_style: hmUI.text_style.WRAP,
      });
      y += titleH + 26;

      // ── Post metadata ──
      const metaParts = [];
      if (post.author) metaParts.push(`u/${post.author}`);
      if (post.created_utc) metaParts.push(timeAgo(post.created_utc));
      metaParts.push(`▲ ${formatNum(post.ups)}`);
      if (post.num_comments !== undefined)
        metaParts.push(`${formatNum(post.num_comments)} comments`);

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + 6,
        y: y,
        w: CW - 12,
        h: 24,
        text: metaParts.join("  ·  "),
        color: TEXT_TERTIARY,
        text_size: 15,
      });
      y += 32;

      this.state.yOffset = y;

      this._loadingWidget = hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN,
        y: y,
        w: CW,
        h: 50,
        text: "Loading comments…",
        color: TEXT_MUTED,
        text_size: 18,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      });

      this._fetchComments(null);
    },

    _fetchComments(after) {
      const g = getGlobal();
      const post = this._post;
      if (!post || this.state.isLoading) return;

      this.state.isLoading = true;

      this.request({
        method: "GET_COMMENTS",
        params: {
          subreddit: g.currentSubreddit,
          postId: post.id,
          limit: this._settings.commentLimit,
          after: after || "",
        },
      })
        .then((data) => {
          this.state.isLoading = false;

          if (this._loadingWidget) {
            hmUI.deleteWidget(this._loadingWidget);
            this._loadingWidget = null;
          }

          if (!data || !data.result || data.error) {
            hmUI.createWidget(hmUI.widget.TEXT, {
              x: MARGIN,
              y: this.state.yOffset,
              w: this._CW,
              h: 50,
              text: "Failed to load comments",
              color: ERROR_RED,
              text_size: 18,
              align_h: hmUI.align.CENTER_H,
            });
            return;
          }

          const { post: postData, comments, after: afterToken } = data.result;
          this.state.afterToken = afterToken;

          if (this.state.allComments.length === 0) {
            this._renderPostBody(postData);
          }

          this.state.allComments = this.state.allComments.concat(comments);
          this._renderComments(comments);

          this._renderFooter();
        })
        .catch(() => {
          this.state.isLoading = false;
          if (this._loadingWidget) {
            hmUI.deleteWidget(this._loadingWidget);
            this._loadingWidget = null;
          }
          hmUI.createWidget(hmUI.widget.TEXT, {
            x: MARGIN,
            y: this.state.yOffset,
            w: this._CW,
            h: 50,
            text: "Connection error",
            color: ERROR_RED,
            text_size: 18,
            align_h: hmUI.align.CENTER_H,
          });
        });
    },

    _renderPostBody(postData) {
      const CW = this._CW;
      let y = this.state.yOffset;

      if (postData && postData.selftext) {
        const bodyText = decodeEntities(postData.selftext);
        const bodyH = measureTextHeight(hmUI, bodyText, 18, CW - 28);

        hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: MARGIN,
          y: y,
          w: CW,
          h: bodyH + 24,
          color: BG_CARD,
          radius: CARD_RADIUS,
        });
        hmUI.createWidget(hmUI.widget.TEXT, {
          x: MARGIN + 14,
          y: y + 12,
          w: CW - 28,
          h: bodyH,
          text: bodyText,
          color: TEXT_SECONDARY,
          text_size: 18,
          text_style: hmUI.text_style.WRAP,
        });
        y += bodyH + 32;
      }

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN + 20,
        y: y,
        w: CW - 40,
        h: 1,
        color: DIVIDER,
      });
      y += 14;

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + 6,
        y: y,
        w: CW,
        h: 24,
        text: "COMMENTS",
        color: TEXT_MUTED,
        text_size: 14,
      });
      y += 30;

      this.state.yOffset = y;
    },

    _renderComments(comments) {
      const CW = this._CW;
      let y = this.state.yOffset;

      if (!comments || comments.length === 0) {
        if (this.state.allComments.length === 0) {
          hmUI.createWidget(hmUI.widget.TEXT, {
            x: MARGIN,
            y: y,
            w: CW,
            h: 40,
            text: "No comments yet",
            color: TEXT_MUTED,
            text_size: 16,
            align_h: hmUI.align.CENTER_H,
          });
          y += 50;
        }
      } else {
        for (const comment of comments) {
          const authorLine = `u/${comment.author}  ·  ▲ ${formatNum(comment.ups)}`;
          const bodyText = decodeEntities(comment.body);
          const bodyH = measureTextHeight(hmUI, bodyText, 17, CW - 28);

          hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: MARGIN,
            y: y,
            w: CW,
            h: bodyH + 44,
            color: BG_CARD,
            radius: 12,
          });

          hmUI.createWidget(hmUI.widget.TEXT, {
            x: MARGIN + 10,
            y: y + 8,
            w: CW - 20,
            h: 22,
            text: authorLine,
            color: ORANGE,
            text_size: 14,
          });

          hmUI.createWidget(hmUI.widget.TEXT, {
            x: MARGIN + 14,
            y: y + 32,
            w: CW - 28,
            h: bodyH,
            text: bodyText,
            color: TEXT_SECONDARY,
            text_size: 17,
            text_style: hmUI.text_style.WRAP,
          });

          y += bodyH + 52;
        }
      }

      this.state.yOffset = y;
    },

    _renderFooter() {
      const W = this._W;
      const CW = this._CW;
      let y = this.state.yOffset;

      for (const w of this.state.loadMoreWidgets) {
        try {
          hmUI.deleteWidget(w);
        } catch (e) {}
      }
      this.state.loadMoreWidgets = [];

      if (this.state.afterToken) {
        const btnBg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: MARGIN,
          y: y + 6,
          w: CW,
          h: 52,
          color: BG_BUTTON,
          radius: 12,
        });
        this.state.loadMoreWidgets.push(btnBg);

        const btnLabel = hmUI.createWidget(hmUI.widget.TEXT, {
          x: MARGIN,
          y: y + 6,
          w: CW,
          h: 52,
          text: `Load more (${this.state.allComments.length} loaded)`,
          color: TEXT_PRIMARY,
          text_size: 17,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
        });
        this.state.loadMoreWidgets.push(btnLabel);

        const btnHit = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: MARGIN,
          y: y + 6,
          w: CW,
          h: 52,
          color: 0xffffff,
          alpha: 0,
        });
        btnHit.addEventListener(hmUI.event.CLICK_UP, () => {
          if (this.state.isLoading) return;

          btnLabel.setProperty(hmUI.prop.TEXT, "Loading…");
          btnLabel.setProperty(hmUI.prop.COLOR, TEXT_MUTED);

          this._fetchComments(this.state.afterToken);
        });
        this.state.loadMoreWidgets.push(btnHit);

        y += 66;
      } else {
        const endLabel = hmUI.createWidget(hmUI.widget.TEXT, {
          x: 0,
          y: y + 6,
          w: W,
          h: 30,
          text:
            this.state.allComments.length > 0
              ? `All ${this.state.allComments.length} comments loaded`
              : "",
          color: TEXT_MUTED,
          text_size: 13,
          align_h: hmUI.align.CENTER_H,
        });
        this.state.loadMoreWidgets.push(endLabel);
        y += 40;
      }

      const backHint = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: y,
        w: W,
        h: 40,
        text: "← swipe right to go back",
        color: TEXT_MUTED,
        text_size: 14,
        align_h: hmUI.align.CENTER_H,
      });
      this.state.loadMoreWidgets.push(backHint);
    },
  }),
);
