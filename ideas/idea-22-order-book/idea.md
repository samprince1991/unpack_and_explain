---
id: 22
slug: order-book
title: "How a stock price actually gets set"
format: E
category: "Money & payments"
subcategory: "Markets"
week: 5
date: 2026-12-01
status: idea
fit: low
fit_why: "abstract: an order book"
hook: "You never see the hidden queue behind every stock price."
source: "Nasdaq Rule 4757 (Book Processing), via SEC filings"
verify: []
notes: "Order book: buyers' bids and sellers' asks wait in a queue; the price is just the last trade where a bid met an ask. No investing advice."
metrics:  # fill in after posting
  views: null
  reach: null
  nonfollower_pct: null  # % of reach from non-followers
  hold_3s: null  # % of viewers still watching at 3 s
  watch_pct: null  # average watch time, % of video length
  likes: null
  comments: null
  shares: null
  saves: null
  follows: null
---

# Idea 22: How a stock price actually gets set

Not scripted yet. Add `## Script` and `## Caption` sections (see idea-02-gps) when it is.

## Verified facts

Checked 2026-11-06.

- Nasdaq matches orders by price first, then time: a better price goes first, and among equal prices the earliest displayed order goes first (Rule 4757, price/display/time). [SEC exhibit](https://www.sec.gov/file/exhibit-5-4779)
- Cutting an order's size keeps its place in the queue; most other changes send it to the back. [SEC filing 34-72250](https://www.sec.gov/files/rules/sro/phlx/2014/34-72250.pdf)
- The opening, closing and halt crosses also use price, then time. [SEC filing 34-97973](https://www.sec.gov/files/rules/sro/nasdaq/2023/34-97973-ex5.pdf)
- The 'price' you see is the last trade, where the best bid met the best ask. Keep it general: no investing advice.
