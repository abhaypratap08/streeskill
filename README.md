<div align="center">
  
# StreeSkill

  
# *A mobile learning platform designed to empower women through accessible, high-quality skill development*

15-Minute Micro-Courses for Homemakers

StreeSkill is a learning platform that provides short, reel-style vertical videos (15–30 minutes) to help homemakers learn practical skills that can generate income.
</div>
---

## What We Offer
- Basic Tailoring
- Embroidery
- Knitting & Crochet
- Mehendi  
- Baking & Decoration
- Beauty Parlour Basics  
- Packaging Skills
- Beadwork
- Textile Art: Macrame Knot-Tying Techniques
- Candle Making
- Quilling Paper Jewelery
- How to Sell on Meesho / ONDC
- Many more...

---

## Accessibility
- Videos dubbed in few regional Indian languages (initially) 
- Text captions available for deaf and hard-of-hearing learners.

---

## Repository Structure
- `StreeSkill/`: Expo React Native app
- `backend/`: Express + MySQL API

---

## Current Status
Phase: Working prototype

Included today:
- onboarding, login, and signup flows
- dashboard with featured courses and skill tutorials
- vertical reel-style lesson player with captions in Hindi, English, and Tamil
- community and marketplace screens
- settings, profile, analytics, notifications, and API service layers
- mock-friendly app mode so the mobile app runs without requiring a live backend

---

## Running The App

### Mobile App
1. `cd StreeSkill`
2. `npm start`

Useful env vars:
- `EXPO_PUBLIC_USE_MOCK_API=true` keeps the app self-contained
- `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1` points the app at a real backend

### Backend
1. `cd backend`
2. `npm start`

Database setup files:
- `backend/setup.sql`
- `backend/seed.sql`

### Environment Files
- Mobile app example env: `StreeSkill/.env.example`
- Backend example env: `backend/.env.example`

### Student Testing Build
Use the Expo app config in `StreeSkill/app.config.js` and the EAS profiles in `StreeSkill/eas.json`.

Recommended student-test flow:
1. Deploy the backend and database with real env values.
2. Set `EXPO_PUBLIC_API_BASE_URL` to the live backend URL ending in `/api/v1`.
3. Set `EXPO_PUBLIC_USE_MOCK_API=false`.
4. Build an internal APK:
   `cd StreeSkill && eas build -p android --profile preview`
5. Share the generated APK with testers.

Production app-store build:
- `cd StreeSkill && eas build -p android --profile production`

Backend release notes:
- set `JWT_SECRET` to a strong production secret
- set `YOUTUBE_API_KEY` for real tutorial fetching
- set `CORS_ORIGINS` to the mobile/web origins you want to allow

---

### Empowering homemakers with fast, practical, monetizable skills...
