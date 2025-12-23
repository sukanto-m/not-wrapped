# Not-Wrapped 🎧  
*A personal, local-first Spotify Wrapped — without the horoscope.*

Not-Wrapped is a minimal React app that turns your Spotify streaming history into something more honest than the official Wrapped.

No ads.  
No algorithmic guilt.  
Just patterns, loops, late-night habits, and a little self-awareness.

Optionally, it can ask a **local Llama model** to narrate your listening personality — entirely on your machine.

---

## Why this exists

Spotify Wrapped is fun. It’s also marketing.

It compresses a year of listening into a tidy, shareable personality badge — optimized less for truth and more for engagement. It tells you *what kind of listener you are* in a voice that feels authoritative, even when it’s selectively curated.

Not-Wrapped exists for a different reason.

This project treats your listening history as **personal data, not a product**. It doesn’t try to flatter you, rank you, or nudge you toward a narrative that photographs well. Instead, it asks quieter questions:

- What do you replay when nobody’s watching?
- What shows up at 3 AM, again and again?
- Which artists stay with you over months, not minutes?
- When do you explore — and when do you retreat?

The goal isn’t to summarize your taste.  
It’s to **notice its behavior**.

Not-Wrapped is intentionally local-first, minimal, and unshareable by default. It’s closer to a data diary than a dashboard — something you look at to understand yourself, not to perform yourself.

If Spotify Wrapped is a year-end poster,  
Not-Wrapped is the margin notes you actually wrote.

---

## What this does

Given Spotify’s `StreamingHistory_music_*.json`, the app computes:

- Total listening time (hours / minutes)
- Active listening days
- Unique artists and tracks
- Late-night listening share (00:00–05:59)
- Peak listening hour
- Most diverse listening day (by artists)
- Biggest single-artist binge (per day)
- Maximum same-day track looping
- Micro-skip rate (plays under 10 seconds)
- Top artists and top tracks
- Year-wise listening split (e.g. 2024 → 2025)

Optionally:
- Generates a witty, affectionate commentary using a **local Llama model via Ollama**

---

## Philosophy

Spotify Wrapped tells you *what you should feel*.

Not-Wrapped shows you:
- what you actually replayed
- when you listened
- how your taste behaves under stress, nostalgia, or insomnia

This is a **data diary**, not a marketing artifact.

---

## Tech stack

- React (Vite)
- Plain CSS (no Tailwind, no CSS frameworks)
- Pure client-side analytics (no backend required)
- Optional local LLM via Ollama (`llama3`, `llama3.2`, etc.)

---

## Getting started

### 1. Install dependencies

```
npm install
```

### 2. Run the app

```
npm run dev
```

### 3. Upload your Spotify data

- Go to Spotify → Account → Privacy → Download your data
- Use `StreamingHistory_music_0.json`
- Upload it in the app UI

That’s it.

---

## Optional: AI commentary (local only)

If you want the AI narration:

### 1. Install Ollama

https://ollama.com

### 2. Pull a model

```
ollama pull llama3.2
```

### 3. Start Ollama

```
ollama serve
```

The app talks to Ollama via a local Vite proxy.  
Your listening data never leaves your machine.

---

## Project structure

```
src/
  lib/
    wrapped.js   # analytics logic (pure JavaScript)
    llama.js     # local LLM commentary (optional)
  App.jsx        # UI and orchestration
  index.css     # plain CSS styling
  main.jsx
```

---

## What this is not

- Not a Spotify clone
- Not a recommendation engine
- Not a cloud service
- Not trying to be “social”

It’s a **personal lens** on your listening history.

---

## Future ideas

- 3–4 AM Hall of Fame
- Month-by-month listening arcs
- “Then vs Now” comparisons
- Exportable story cards
- Offline-only PWA mode

---

Built for curiosity, not virality.
