import { BaseApp } from "@zeppos/zml/base-app";

App(
  BaseApp({
    globalData: {
      posts: [],
      currentIndex: 0,
      currentSubreddit: "technology",
      currentSort: "hot",
      imageCache: {},
      pendingImagePostId: null,
      pendingImageGeneration: 0,
      needsRefresh: false,
      settingsChanged: false,
      initialized: false,
      editSetting: null,
    },
    onCreate(options) {
      console.log("[Reddit] App created");
    },
    onDestroy(options) {
      console.log("[Reddit] App destroyed");
    },
  }),
);
