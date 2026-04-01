import { BaseSideService } from "@zeppos/zml/base-side";

async function fetchReddit(subreddit, limit, sort, res) {
  try {
    const sortPath = sort || "hot";
    const response = await fetch({
      url: `https://www.reddit.com/r/${subreddit}/${sortPath}.json?limit=${limit || 15}`,
      method: "GET",
      headers: { "User-Agent": "ZeppOS-Reddit" },
    });

    if (!response || !response.body) throw new Error("API_ERR");

    const body =
      typeof response.body === "string"
        ? JSON.parse(response.body)
        : response.body;

    const posts = body.data.children.map((c) => {
      const d = c.data;
      let imageUrl = null;
      const preview = d.preview;
      if (preview && preview.images && preview.images[0]) {
        const resolutions = preview.images[0].resolutions;
        const suitable = resolutions
          .filter((r) => r.width <= 480)
          .sort((a, b) => b.width - a.width)[0];
        imageUrl = suitable
          ? suitable.url
          : resolutions[resolutions.length - 1]
            ? resolutions[resolutions.length - 1].url
            : null;
      } else if (d.thumbnail && d.thumbnail.startsWith("http")) {
        imageUrl = d.thumbnail;
      }

      if (imageUrl) imageUrl = imageUrl.replace(/&amp;/g, "&");

      return {
        id: d.id,
        title: d.title,
        author: d.author,
        ups: d.ups,
        num_comments: d.num_comments,
        created_utc: d.created_utc,
        is_self: d.is_self,
        imageUrl,
      };
    });

    res(null, { result: posts });
  } catch (e) {
    res(null, { result: "ERR" });
  }
}

async function fetchComments(subreddit, postId, limit, after, res) {
  try {
    let url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=${Math.max(limit || 25, 25)}&sort=top`;
    if (after) {
      url += `&after=${after}`;
    }

    const response = await fetch({
      url,
      method: "GET",
      headers: { "User-Agent": "ZeppOS-Reddit" },
    });

    const json =
      typeof response.body === "string"
        ? JSON.parse(response.body)
        : response.body;

    const post = json[0].data.children[0].data;
    const rawComments = json[1].data.children;
    const afterToken = json[1].data.after || null;

    const comments = [];
    for (const c of rawComments) {
      if (c.kind === "t1") {
        comments.push({
          author: c.data.author,
          body: c.data.body,
          ups: c.data.ups,
        });
      }
    }

    res(null, {
      result: {
        post: {
          title: post.title,
          selftext: post.selftext || "",
          author: post.author,
          ups: post.ups,
        },
        comments,
        after: afterToken,
      },
    });
  } catch (e) {
    res(null, { result: null, error: "ERR_COMMENTS" });
  }
}

async function fetchImage(imageUrl, postId, res, ctx) {
  try {
    res(null, { result: "TRANSFER_STARTED" });

    const tempFileName = `data://download/raw_${postId}.png`;

    const tryDownload = (url, onFail) => {
      console.log("[Redditing image:", url);
      const downloadTask = network.downloader.downloadFile({
        url,
        timeout: 30000,
        filePath: tempFileName,
      });

      downloadTask.onSuccess = async (event) => {
        try {
          let targetPath = event.filePath;

          try {
            const convResult = await image.convert({
              filePath: event.filePath,
            });
            if (convResult && convResult.targetFilePath) {
              targetPath = convResult.targetFilePath;
            }
          } catch (convErr) {
            console.log("[Reddit failed, sending raw file", convErr);
          }

          console.log(
            "[Reddit] sending file",
            targetPath,
            "for postId",
            postId,
          );
          ctx.sendFile(targetPath, { postId });
        } catch (err) {
          console.log("[Reddit] post-download error", err);
          ctx.call({
            method: "IMAGE_FAILED",
            params: { postId, error: "SEND_ERR" },
          });
        }
      };

      downloadTask.onFail = (event) => {
        console.log("[Reddit] download failed", event);
        if (onFail) {
          onFail();
        } else {
          ctx.call({
            method: "IMAGE_FAILED",
            params: { postId, error: "DL_FAIL" },
          });
        }
      };
    };

    tryDownload(imageUrl, () => {
      console.log("[Reddit] direct download failed, trying proxy");
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=400&output=png`;
      tryDownload(proxyUrl, null);
    });
  } catch (e) {
    console.log("[Reddit] fetchImage exception", e);
    ctx.call({
      method: "IMAGE_FAILED",
      params: { postId, error: e.message || "UNKNOWN" },
    });
  }
}

AppSideService(
  BaseSideService({
    onRequest(req, res) {
      if (req.method === "GET_REDDIT") {
        fetchReddit(
          req.params.subreddit,
          req.params.limit,
          req.params.sort,
          res,
        );
      } else if (req.method === "GET_COMMENTS") {
        fetchComments(
          req.params.subreddit,
          req.params.postId,
          req.params.limit,
          req.params.after || null,
          res,
        );
      } else if (req.method === "FETCH_IMAGE") {
        fetchImage(req.params.url, req.params.postId, res, this);
      }
    },
  }),
);
