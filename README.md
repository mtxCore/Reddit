# Reddit for ZeppOS

A minimal, efficient Reddit client for watches running ZeppOS.

## Features

- **Feed** — Swipe through posts from any subreddit with default reddit sort options
- **Images** — Directly view images from posts through the app
- **Subreddit Management** — Switch subreddits and add more to your list
- **Settings** — Adjust post limit, comment limit, font size, and image visibility
- **Saved Settings** — All settings and the last-viewed subreddit are saved

## Requirements

- ZeppOS that supports API version **4.2** (or later)
- A rounded square device

> Tested on my Amazfit BIP 6. Other ZeppOS 4.2+ devices should work I think.

## Navigation

| Gesture | Action |
|---|---|
| Swipe left / right | Next / previous post |
| Tap post | Open comments |
| Tap subreddit name | Switch subreddits & view settings |

## Default Subreddits

`technology`, `news`, `funny`, `gaming`, `askreddit`

These can be added to or removed from your favorites list at any time.

## Notes

- Uses Reddit's public JSON API. No account or API key are required.
- Settings are stored locally on the device
