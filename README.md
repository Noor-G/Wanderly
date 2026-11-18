# Wanderly

A tourist app for exploring Singapore. Browse attractions on an interactive map, get a generated itinerary based on your preferences, and manage your bookings, all in one place.
Demo video : https://www.youtube.com/watch?v=yeu5s2rQMXc 
## Features

- **Interactive map**: explore Singapore's tourist attractions on a Mapbox map
- **Itinerary generator**: build a trip plan from your interests and preferences
- **Bookings**: view booking details and confirmations
- **Accounts**: sign up, log in, OTP verification, and password reset
- **Profile and preferences**: manage your details and travel preferences
- **Mobile-friendly UI**: bottom navigation and responsive layouts

## Tech Stack

- [Next.js](https://nextjs.org/) with React and TypeScript
- [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) components
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) for maps
- [Supabase](https://supabase.com/) for the database and authentication

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A [Mapbox](https://www.mapbox.com/) account (for a public access token)
- A [Supabase](https://supabase.com/) project

### Installation

```bash
git clone https://github.com/Noor-G/Wanderly.git
cd Wanderly
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_public_mapbox_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use a **public** Mapbox token (starts with `pk.`). Never commit `.env.local` or any secret key to the repository.

### Database setup

Run the SQL in [`database/schema.sql`](database/schema.sql) in your Supabase project's SQL editor to create the required tables. Enable Row Level Security on your tables before using the app with real data.

### Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/          Next.js app router entry (layout and page)
components/   Page components, layouts, and shared UI
data/         Data access for auth, users, bookings, itineraries
database/     SQL schema
hooks/        Custom React hooks
lib/          Supabase client and helper utilities
public/       Static assets and attractions GeoJSON data
services/     Itinerary generation logic
styles/       Global styles
types/        TypeScript type definitions
```

## Data

Attraction data comes from a Singapore tourist attractions GeoJSON file in `public/data/Tourists_Attractions.geojson`.

## Contributors

Wanderly was built by Group 3 for the SC2006 Software Engineering course.

- Ekhnoor Kaur Grover ([@Noor-G](https://github.com/Noor-G))
- Boo Yi Herng, Trixie
- Mah Shi Lei Rebecca
- Patrick Elliot Subagio
- Thwun Thiri Thu
