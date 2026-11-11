---
id: 14
slug: qr-code
title: "How a QR code stores data"
topic: "QR code"
format: E
category: "Everyday tech"
subcategory: "Data & codes"
week: 4
date: 2026-11-24
status: rendered
hook_formula: 3
hook_score: 81.4
question_score: 62.2
hook: "Nobody tells you 3 squares tell your camera which way is up."
source: "Denso Wave (qrcode.com); ISO/IEC 18004"
verify: []
notes: "Question = how it survives damage (answered by the backup bits, Reed-Solomon error correction); hook = the 3 finder squares give position and orientation. 'Up to 30%' is level H, about 30% of codewords (not area: the finder squares themselves can't be lost). '8 bits = 1 letter' is byte mode, which links use (lowercase letters need byte mode)."
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

# Idea 14: How a QR code stores data

## Spine

| Part | Job |
|---|---|
| Question | how QR codes still scan with 30% missing |
| Hook | the 3 big squares tell your camera which way is up |
| Setup | a QR code is a grid of squares, each a yes or no, but your camera sees it tilted and scratched |
| Mechanism | the camera finds the 3 corner squares first and turns the code upright; each small square is one bit (black 1, white 0); 8 bits spell one letter; backup bits are mixed in so missing squares can be worked out |
| Payoff | with the strongest backup, up to 30% can be missing and it still scans |
| Answer | Mechanism: backup bits are mixed in, so missing squares can be worked out from the rest |

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how QR codes still scan with 30% missing? | Question card over the Blender opener: a QR code on a table stand on a cafe table at night, slow orbit, a patch of its modules amber. |
| Hook | Nobody tells you 3 squares tell your camera which way is up. | Blender hook: the QR code, tilted; on 'squares' the three corner squares amber; on 'way' the code turns upright. |
| Setup | A QR code is a grid of squares, each a yes or no. But your camera sees it tilted and scratched. | 2D line art: a flat QR grid; on 'yes or no' one module flips black/white (amber); on 'tilted' the grid skews in perspective; on 'scratched' a scratch line drags across it (amber moves to the scratch). |
| Mechanism | So your camera finds the three corner squares first, and turns the code upright. Then each small square is one bit: black is one, white is zero. Every eight bits spell one letter. But backup bits are mixed in, so missing squares can be worked out. | Blender: wide on the tilted code, the three corner squares amber; on 'upright' the code turns upright; on 'square' close on one module (amber); on 'eight' close on a 2x4 block of modules (amber), on screen its bits "01101110"; on 'backup' wide, a 6x6 patch of modules amber; on 'missing' it tears away; on 'worked' it comes back into place. |
| Payoff | With the strongest backup, up to 30% can be missing, and it still scans. | 2D: the QR grid with a torn corner and a logo square growing in the middle (no VO on the logo; it shows what "missing" looks like in real life); on '30%' a bar fills to "30%" (amber); on 'still scans' the scan frame locks onto the three corner squares and a link line appears under the code (amber moves to the link). |
| Congrats | Congrats, you just learned how a QR code stores data. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Cold read

About: how a QR code stores data
Asks: how QR codes still scan with 30% missing
Answer: a QR code is a grid of squares, each one bit (black 1, white 0), with 8 bits per letter; the camera finds the 3 corner squares first and turns the code upright; backup bits are mixed in, so missing squares can be worked out, up to 30% with the strongest backup

## Notes

- Question cards scored: "Do you know how QR codes still scan with 30% missing?" 62.2 (picked by the user, 2026-11-11); "...why QR codes never have 4 big squares?" 62.2; "...why every QR code has 3 squares?" 40.6; "...how a QR code works when torn?" 28.2.
- Hooks scored: "Nobody tells you 3 squares tell your camera which way is up." 81.4 (picked); "...the 3 QR squares tell your camera..." 75.7 (longer); "Nobody tells you a QR code can lose 30% and still scan." 87.0 (repeats the question); old hook "A QR code is a tiny grid of yes/no answers." 37.2 (now the setup).
- Hook title (max 28 chars): "Which way is up?", highlight "up".
- 'Up to 30%' is said with 'with the strongest backup' because it is level H only; most codes use level M (15%) (Denso Wave).
- World: none fits yet (bench is a jeweller's bench); build a `cafe-table` world or adapt `bench`. Model: procedural QR code stand (`qr-code`): a real version 1-H code (21 x 21) of the text "unpack", raised modules on a card.

## Caption

A QR code can lose up to 30% of its data and still scan. Save this for the next time you see a scratched one.

Three big corner squares tell your camera where the code is and which way is up. That works at any angle.

Then each small square is one bit: black is 1, white is 0. Eight bits spell one letter.

The trick is the backup. Extra bits are mixed in, so missing squares can be worked out from the rest. The strongest level, H, covers up to 30%. Level M (15%) is the one most codes use.

Source: Denso Wave (qrcode.com); ISO/IEC 18004

#qrcode #howitworks #howthingswork #tech #explained

## Verified facts

Checked 2026-11-11.

- QR Code was developed by Denso Wave (then a division of Denso) and released in 1994; development was led by Masahiro Hara. The position detection patterns (corner squares) tell the reader a code is there and enable high-speed reading; their 1:1:3:1:1 black-white ratio lets the reader find the code's orientation at any angle. [Denso Wave, history](https://www.qrcode.com/en/history/)
- "Readable from any direction in 360°." [Denso Wave, about](https://www.qrcode.com/en/about/)
- "QR Code has error correction capability to restore data if the code is dirty or damaged"; rates are a share of total codewords; level M (15%) is most often used; Q or H for dirty environments. [Denso Wave, error correction](https://www.qrcode.com/en/about/error_correction.html)
- Levels: L about 7%, M 15%, Q 25%, H 30% of codewords. [Telerik, QRCodeErrorCorrection](https://www.telerik.com/kendo-vue-ui/components/barcodes/api/qrcodeerrorcorrection), [Seagull Scientific](https://help.seagullscientific.com/2016/en/Content/ErrorCorrection_QRCode.html)
- Byte mode stores each character as an 8-bit binary string; lowercase text needs byte mode (alphanumeric mode has no lowercase). [Thonky, byte mode](https://www.thonky.com/qr-code-tutorial/byte-mode-encoding)
