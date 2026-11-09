---
id: 7
slug: credit-score
title: "How credit scores work"
format: E
category: "Money & payments"
subcategory: "Credit"
week: 2
date: 2026-11-12
status: rendered
hook_formula: 20
hook_score: 77.8
question_score: 51.8
hook: "You don't need a big salary for a high credit score."
source: "myFICO, What's in your credit score; CFPB, What is a credit score"
verify:
  - "35/30/15/10/10 is FICO's general breakdown; the mix can differ from person to person. Script says 'a FICO score weighs', keep the source on screen"
notes: "Scores differ by country and model; this is FICO, the US model. Explains, doesn't advise: no 'do this to raise your score'."
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

# Idea 7: How credit scores work

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Does your credit score know your salary? | Question card (template) over the Blender opener: five weights of different sizes on a rack, the biggest amber. |
| Hook | You don't need a big salary for a high credit score. | Blender hook: the camera turns to the rack, the dial amber on 'salary', then the biggest weight amber on 'credit'. |
| Setup | It isn't a grade on your wealth. It's a prediction: how likely are you to repay what you borrow? Most scores run from 300 to 850. | 2D: LineIcon wallet with an amber strike-through on 'wealth'; a dashed `LineChart`-style forward path draws on 'prediction' (shape only, no data); `Gauge` settles in on 'scores' with a NumberCounter running 300 to 850, the needle amber. Parallax + dust. |
| Mechanism | A FICO score weighs five things from your credit report. Paying on time counts most, at 35 percent. How much you owe is 30. How long you've had credit is 15. New applications and your mix of credit are 10 each. | Blender mechanism: wide on the rack; the dial drops away and each weight lifts forward, amber, in close-up as it's named, its percent written on it in 2D (35%, 30%, 15%, 10%, 10%); wide again on 'each' as the dial returns and all five settle. |
| Payoff | Lenders may still ask about your salary. But the score itself never sees it. It only sees your habits. | 2D: `PhoneFrame` loan form with an income field on 'salary'; the form fades and the five parts return as a `PieChart` donut (35% in the hole, payment history amber) on 'score'; on 'habits' the donut holds with the slice pulled out. |
| Congrats | Congrats, you just learned how credit scores work. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Notes

- Hooks scored (hookscore.py): #20 Permission "You do not need a big salary for a high credit score." 77.8 STRONG; #23 Statistic "35% of your credit score comes from one habit." 55.4; #3 Nobody Tells You "Nobody tells you your credit score ignores your income." 52.2. The old hook "Your score is a guess about your future." scored 28.2. Question card "Does your credit score know your salary?" 51.8.
- Beat sheet at 150 wpm: 121 words, ~48.4 s. Beats over 4 s are covered by visual changes every 2 s.
- /ig-human (suggestions, not applied): BURSTINESS 2.7 (advisory on our even sentences), other signals 100. Human score 49.4 FLAGGED, from burstiness only. The payoff says "salary" to echo the hook (approved by the owner). FICO's own wording is "income": salary is one kind of income, and the caption says income.

- 3D: procedural model `credit-weights` (`blender/models/credit_weights.py`, license own): five calibration weights on a rack, sized by importance, with a half-ring dial. `build.py` can't rotate a part on a beat, so a tilting balance wasn't possible; each weight lifts forward with `shift` instead.
- Scene styles: posts 20, 21 and 26 used ChatBox, CodeBlock, CycleDiagram, PhoneFrame, WaveProfile and Gauge. This post leads with a D3 donut chart and a score dial; PhoneFrame returns only for the loan form.

## Caption

Save this: 35% of your FICO credit score is paying on time. Your salary counts for nothing.

The score never looks at your income. It's a prediction of how likely you are to repay what you borrow, built from your credit report.

Payment history is 35%. Amounts owed is 30%. Length of credit history is 15%. New credit and credit mix are 10% each.

Lenders can still ask about your income when you apply. That's their decision, and it isn't part of the score.

This is how FICO works in the US. Other scoring models can weigh things differently.

Source: myFICO, CFPB

#creditscore #fico #personalfinance #howitworks

## Verified facts

Checked 2026-11-09.

- The five categories: payment history 35%, amounts owed 30%, length of credit history 15%, new credit 10%, credit mix 10%. [myFICO](https://www.myfico.com/credit-education/whats-in-your-credit-score)
- FICO scores don't factor in income, or job and employment details, but "lenders might assess some of these financial factors when making their own lending decisions." [myFICO](https://www.myfico.com/credit-education/whats-in-your-credit-score)
- "A credit score is a prediction of your credit behavior." "Most credit scores range from 300-850." "You do not have just 'one' credit score." [CFPB](https://www.consumerfinance.gov/ask-cfpb/what-is-a-credit-score-en-315/)
