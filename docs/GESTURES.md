# Gestures — design and parameters (matches js/gesture-core.js)

**Principle:** every input (webcam fingertip, phone wand, mouse) becomes the same stream of 2D points `(x, y, t)` in
screen units (1 unit = min(screenW, screenH) px, t in seconds). The same recognizers run for all inputs, so behaviour is
identical and unit-testable (`npm test`, 20 tests).

## Gesture set (v0.3.0)
| Gesture | Input | Action | Method |
|---|---|---|---|
| ◯ Circle (either direction) | hand / wand / mouse | Open portal at the circle; if open → jump to a random place | Angle accumulation (below) |
| ⇆ Flick left/right | hand / wand / mouse | Previous / next place (only while a portal is open) | Straight fast stroke (axis x) |
| ⇅ Flick up / down | hand / wand / mouse | Full-screen portal / back (also Enter, double-click, wheel past max, 🙌 spread wide) | Straight fast stroke (axis y) |
| ✊ Fist held 0.5 s | hand | Close | MediaPipe `Closed_Fist` + hold |
| 👎 Thumb down held 0.5 s | hand | Close | `Thumb_Down` + hold |
| ✌️ Victory held 0.5 s | hand | Random place (opens if closed) | `Victory` + hold |
| 👍 Thumb up held 0.5 s | hand | Video sound on/off | `Thumb_Up` + hold |
| 🤟 “I love you” held 0.5 s | hand | Next theme | `ILoveYou` + hold |
| 🙌 Two open palms apart/together | hand | Resize the portal | Wrist distance ratio |
| 📱 Shake | wand | Random place | ≥3 accel peaks > 16 m/s² within 0.8 s |
| Fist = pen up | hand | Stops tracing (no accidental circles while closing) | — |
| Hold the pad = pen down | wand | Only traces while held (free mode optional) | — |

Keyboard extras (v0.3.0): **1–9** jump to a fixed destination (own videos → added streams → featured places),
**R** recording mode (UI hidden), **D** debug overlay. Dragging a video file onto the screen plays it in the portal.

## Circle detector (angle accumulation)
For each new point, look back over the last `tMax` seconds and try windows (longest first):
1. Bounding-box center `c`; radii `r_i = |p_i − c|`.
2. Sum the wrapped angle steps `Δθ` of `(p_i − c)`.
3. Accept if all hold:

| Parameter | Value | Meaning |
|---|---|---|
| `tMin / tMax` | 0.35 s / 2.2 s | circle drawn in 0.35–2.2 s |
| `rMin / rMax` | 0.05 / 0.65 units | not a jitter blob, not larger than the screen |
| `roundMax` | 0.34 | std(r) / mean(r) |
| `angleFrac` | 0.85 | ≥ 306° of a turn |
| `coherenceMin` | 0.8 | \|ΣΔθ\| / Σ\|Δθ\| — rejects jitter & back-and-forth |
| `aspectMin` | 0.5 | bbox w/h within [0.5, 2] |
| `cooldown` | 0.9 s | no double triggers |

Direction = sign(ΣΔθ) (screen y points down → positive = clockwise). The portal’s sparks spin the same way.

## Swipe detector
Window 0.5 s; dominant axis travel ≥ 0.3 units and ≥ 2× the other axis (x → next/prev, y → full screen); straightness (displacement / path) ≥ 0.9; peak speed ≥ 1.8 units/s over
any ≥ 60 ms sub-window; cooldown 0.6 s. Tested so that normal circles (r 0.15–0.4, 0.6–2.0 s) never trigger a swipe.

## Webcam mapping (hand)
- MediaPipe Gesture Recognizer (`@mediapipe/tasks-vision` 1.0.1, VIDEO mode, 2 hands, GPU delegate with CPU fallback),
  ~30 fps cap. Pointer = index fingertip (landmark 8), x mirrored.
- Uniform scale so circles stay circles: `k = screenH / (0.72 · cameraH) · sensitivity`; screen = center + (tip − 0.5)·cam·k.
- Smoothing: One-Euro filter (minCutoff 1.2 Hz, beta 6, in screen units). Hand removed after 0.35 s unseen.

## Phone “air mouse” (wand)
- `rotationRate` (deg/s) projected on the gravity-up vector → **yaw** (horizontal) and on the horizontal-right vector
  → **pitch** (vertical). Works whether the phone is held flat like a remote or upright like a camera; wrist roll ignored.
- Gravity sign differs across platforms → auto-calibrated from the first 6 samples (user holds the phone screen-up/facing).
- Gain 0.012 units per degree × user slider (0.4–2.5). Deadzone 1.5 deg/s kills gyro drift. “Center” button recenters.
- No gyro / no HTTPS → the pad works as a touch trackpad (drag = cursor, hold = pen down).

## Tuning targets (Tech gate, 21 Oct 2026)
4 people × 20 attempts × each mode at 1.5–3 m in living-room light → camera ≥ 85%, wand ≥ 90%, ≤ 1 false trigger in
10 min idle. Log results in docs/TEST_CHECKLIST.md. If camera < 85%: first try `sensitivity` 1.2–1.4 and better
front lighting; then relax `roundMax` to 0.4 and `angleFrac` to 0.8; only then consider $1-recognizer/DTW templates.

Known limits: backlight (window behind the user) is failure #1, dim light #2; laptop placed below the TV means the user
faces the TV, not the camera — put the laptop/webcam under the TV facing the room.
