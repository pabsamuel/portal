# 09 — Android TV / Fire TV (sadece Gelir Kapısı 1 geçerse)

```
Create /android-tv as a minimal Android project (Kotlin) that wraps the hosted app in a WebView:
- Leanback launcher intent, banner 320×180, D-pad navigation for the start screen and panels (focus styles in CSS).
- Phone wand = default input (show the QR on first launch). Camera mode only if a UVC webcam is present and gives ≥ 20 fps.
- WebView settings: JavaScript, mediaPlaybackRequiresUserGesture=false, DOM storage; allow the camera permission bridge.
- Store listings with the original brand only; privacy labels (camera: not collected).
Build steps must work on Windows (Android Studio). Document in docs/ANDROID_TV.md.
```
**Acceptance:** Runs on one Google TV device and one Fire TV Stick; approved in Google Play + Amazon Appstore.
