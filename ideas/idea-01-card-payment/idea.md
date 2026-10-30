---
id: 1
slug: card-payment
title: "How a card payment works"
format: E
category: "Money & payments"
subcategory: "Payments"
week: 1
date: 2026-11-02
status: rendered
hook: "Nobody tells you a card tap moves zero money."
hook_formula: 3
hook_score: 81.4
question_score: 51.8
source: "Card network / acquirer docs"
verify:
  - "Settlement timing (varies by country and card network); cite the source on screen"
  - "Up to five companies in the chain (terminal provider/processor, shop's bank, card network, your bank)"
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

# Idea 1: How a card payment works

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Who approves your card in 2 seconds? | Question card (template). |
| Hook | Nobody tells you a card tap moves zero money. | Card taps a terminal; amber ping on contact. Hook title "A card tap moves $0". |
| Setup | Your card doesn't hold your money. It holds a number that points to your bank. Up to five companies pass that number along. | Card outline turns into a number; a line draws to a bank icon; five dots appear one by one. |
| Mechanism | The terminal sends it to the shop's bank. That bank hands it to the card network. That's Visa or Mastercard. The network finds your bank. Your bank checks your balance and fraud signals. It says yes or no, and the answer races back. | Chain terminal > shop's bank > network > your bank. Amber packet travels along it, camera follows; teal check at your bank; packet races back. Enters with `push`. |
| Payoff | That yes is only a promise. The real money moves later, in settlement. That's a day or two after your tap. | Chain fades to a dashed "promise" line; calendar flips forward 1-2 days; line turns solid as the money moves. Enters with `zoomDip`. |
| Congrats | Congrats, you just learned how a card payment works. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Caption

Save this for the next time someone says a contactless card payment is done in 2 seconds.

Those 2 seconds only get you a yes from your bank, passed along a chain of up to five companies. Tap-to-pay feels like money leaving your account, but nothing has moved yet.

The real transfer, called settlement, comes a day or two later.

#howitworks #payments #contactless #explained
