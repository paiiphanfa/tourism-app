# Thailand Trip Planner — Product Overview

*Working prototype status as of August 21, 2026*

## The pitch

Most travel apps either hand you a generic, canned itinerary or a chatbot that talks about your trip without being able to touch it. This app does both properly: it builds a real, day-by-day Thailand itinerary from actual places (not invented ones), and its chat companion can **directly edit that itinerary** when you ask it to — swap a stop, drop one, adjust your plan — not just suggest and leave you to do the work yourself.

## The problem it solves

Independent travelers to Thailand — especially solo tourists — face two recurring frustrations:

- **Planning is fragmented.** Piecing together a realistic day-by-day route across temples, food, nature, and shopping means juggling five different apps and guides.
- **Generic AI chat isn't enough.** Ask a normal AI chatbot for a new idea while traveling and it gives you a suggestion — it has no idea what your actual plan looks like, and it can't change it even if it did.

## Core features

### Real, grounded itinerary generation
Search a destination and trip length (e.g. "Chiang Mai, 3 days"), optionally add interests (temples, cafés, nature, markets…), and get a complete day-by-day plan — real places, sensible order by geography and opening hours, and a short personalized note on every stop explaining why it's there. Every place in the plan is a real, verified location — the itinerary is never allowed to invent a place that doesn't exist.

### A chat companion that actually edits your trip
Tell it "this place is boring" or "swap this for something else" and it doesn't just reply with a suggestion — it identifies a real, nearby alternative and **updates your itinerary on the spot**, with a clear confirmation of exactly what changed. This is the core differentiator versus a standard AI travel chatbot: the conversation and the plan are the same object, not two disconnected things.

### Nationwide coverage
Built to cover all **77 Thai provinces and 928 districts**, not just one region. Place data is sourced from real, continuously-updated location data (Google Places), so coverage grows automatically as travelers plan trips to new areas.

### Transportation guidance between stops
Every itinerary automatically estimates how to get from one stop to the next — walk, tuk-tuk/taxi/Grab, or car — based on the real distance between places, so the plan reads as something you can actually follow, not just a list of names.

### One-tap navigation
A "Open in Google Maps" button drops every stop for the day (or the whole trip) into a single Google Maps route with all pins ready to go — no manual pin-dropping.

### Trip dashboard
A home screen listing every trip a user has planned, so past and current itineraries are always one tap away — the app is a running travel companion, not a single-use planner.

### Accounts & location awareness
Secure sign-up/login, and the app uses the traveler's live location (with permission) to help ground planning around where they actually are.

## What makes this defensible

1. **Grounded, not hallucinated.** Every place the AI can put in a plan or suggest in chat comes from a verified real-location database — the AI sequences and personalizes, it never invents.
2. **Editable by conversation.** The chat isn't a bolt-on FAQ bot; it's a real interface for changing the product's core object (the itinerary), validated the same rigorous way as generation itself.
3. **Built to scale nationwide from day one.** The data model and place-sourcing pipeline already span the whole country, not a single pilot city.

## Built on

Native iOS and Android from a single codebase (React Native), a Node.js backend, Google's Gemini models for itinerary generation and conversation, and Google Places for real, current location data across Thailand.

## Current status

This is a working, hands-on-tested prototype: account creation, itinerary generation, the trip dashboard, transportation guidance, Maps integration, and chat-driven itinerary editing have all been verified working end-to-end on a physical device. Nationwide place coverage is live and expands automatically as new provinces are requested.
