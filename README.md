# Mars and Memory

An immersive, interactive web experience built with Next.js and Framer Motion. This project creates a "scrollytelling" journey to explore high-resolution historical artifacts through scroll-driven deep zooms, panning cameras, and narrative text reveals.

This repository is structured as a **Turborepo Monorepo** to facilitate code sharing across platforms.

## 🏗 Repository Structure

```text
mars-and-memory/
├── apps/
│   ├── web/       # Next.js web application
│   └── mobile/    # React Native / Expo mobile application
├── packages/
│   ├── api/       # API client (fetch + Zod)
│   ├── config/    # Shared configurations (ESLint, TS, etc.)
│   ├── db/        # Supabase client wrapper and database types
│   ├── types/     # Shared Zod schemas and TypeScript definitions
│   └── ui/        # Shared platform-aware React components
```

## ✨ Features

- **Scroll-Driven Narrative:** Uses Framer Motion's `useScroll` and `useTransform` to map scroll progress to CSS properties.
- **Cinematic Transitions:** Sections slide over previous ones using a overlapping margin architecture.
- **Deep-Zoom Panning:** Specialized components allow zooming and panning across high-res images.
- **Monorepo Architecture:** Clean separation of concerns with shared UI, types, and API packages.

## 🛠 Tech Stack

- **Framework:** Next.js (App Router), React Native
- **Monorepo Tooling:** Turborepo, pnpm workspaces
- **Language & Validation:** TypeScript, Zod
- **Animation:** Framer Motion
- **Styling:** Tailwind CSS

## 🚀 Getting Started

This project STRICTLY uses `pnpm` as its package manager.

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the development server:**
   ```bash
   pnpm run dev
   ```

3. **Other Useful Commands:**
   ```bash
   pnpm run build       # Build all apps and packages
   pnpm run lint        # Run linting across the monorepo
   pnpm run type-check  # Run type checking
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the web app locally.
