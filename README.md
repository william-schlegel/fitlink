# Fitlink - Coaching Platform

A modern Next.js 16 application for coaching and sports management with TypeScript, Tailwind CSS v4, shadcn/ui, Drizzle ORM, tRPC, better-auth, Convex, and next-intl.

## Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript + React 19
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI), class-variance-authority
- **Database**: PostgreSQL with Drizzle ORM
- **API**: tRPC + Next.js route handlers
- **Auth**: better-auth (email/password, magic link, social)
- **Realtime**: Convex (chat + notifications)
- **File uploads**: UploadThing
- **Maps**: Mapbox GL + MapQuest geocoding
- **State Management**: TanStack Query
- **Validation**: Zod
- **Internationalization**: next-intl
- **Package Manager**: Bun

## Highlights

- **Data Access Layer (DAL)** in `src/db/dal` with shared Zod schemas in `src/schemas`
- **shadcn/ui** components under `src/components/ui/shadcn` (see `components.json`)
- **better-auth** integration in `src/lib/auth` with a Drizzle adapter
- **Convex** realtime chat and notifications in `convex/` and `src/lib/convex`
- **AI assistant endpoint** at `/api/assistant` (Gemini or HuggingFace via `src/lib/llm`)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Optional: Mapbox/MapQuest keys, UploadThing, Convex, and LLM provider keys

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   bun install
   ```

3. Copy `.env.example` to `.env` and fill required values (see `src/env.ts` for the full list)
4. Run the development server:

   ```bash
   bun run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Internationalization (i18n)

This project uses next-intl for internationalization with the following setup:

### Supported Languages

- **French (fr)** - Default language
- **English (en)** - Secondary language

### Configuration Files

- **`src/i18n.ts`**: Main i18n configuration
- **`messages/fr.json`**: French translations
- **`messages/en.json`**: English translations
- **`src/app/layout.tsx`**: Loads messages into `NextIntlClientProvider`

### Usage in Components

```typescript
import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t("home.title")}</h1>
      <p>{t("home.subtitle")}</p>
    </div>
  );
}
```

### Language Switcher

The app includes a `LanguageSwitcher` component:

```typescript
import LanguageSwitcher from "@/components/LanguageSwitcher";

<LanguageSwitcher />;
```

## tRPC Setup

This project uses tRPC for type-safe APIs:

### Server-side Configuration

- **`src/lib/trpc/server.ts`**: tRPC context and helpers
- **`src/server/api/root.ts`**: Root router combining sub-routers
- **`src/server/api/routers/`**: Individual route handlers
- **`src/app/api/trpc/[trpc]/route.ts`**: Next.js API route handler

### Client-side Configuration

- **`src/lib/trpc/client.ts`**: tRPC client configuration
- **`src/lib/trpc/provider.tsx`**: React Query provider wrapper
- **`src/app/layout.tsx`**: Root layout with tRPC and i18n providers

### Usage Example

```typescript
import { trpc } from "@/lib/trpc/client";

export function MyComponent() {
  const users = trpc.user.list.useQuery({ limit: 10 });
  const createUser = trpc.user.create.useMutation();

  if (users.isLoading) return <div>Loading...</div>;

  return (
    <div>
      {users.data?.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

## Data Access Layer (DAL) & Schemas

The DAL provides typed database operations and is paired with shared Zod schemas:

- **DAL**: `src/db/dal`
- **Schemas**: `src/schemas`
- **Guide**: `docs/dal-guide.md`

## Project Structure

```text
convex/                  # Convex functions and schema
docs/                    # Internal guides
drizzle/                 # Drizzle migrations
messages/                # i18n translations
src/
├── app/                 # Next.js App Router pages
├── actions/             # Server actions
├── components/          # UI and feature components
│   └── ui/shadcn/        # shadcn/ui components
├── db/
│   ├── dal/             # Data Access Layer
│   ├── schema/          # Drizzle schema definitions
│   └── index.ts         # Database connection
├── lib/
│   ├── auth/            # better-auth client/server helpers
│   ├── convex/          # Convex client/server helpers
│   ├── llm/             # Assistant integrations
│   └── trpc/            # tRPC configuration
├── schemas/             # Shared Zod schemas
└── i18n.ts              # Internationalization config
```

## Development

- **Dev**: `bun run dev`
- **Build**: `bun run build`
- **Lint**: `bun run lint`
- **Lint (all)**: `bun run lint:all`
- **Typecheck**: `bun run tsc`
- **Format**: `bun run format`

## Database

The project uses Drizzle ORM with PostgreSQL:

- **Schema**: `src/db/schema`
- **Migrations**: `drizzle/`
- **DAL**: `src/db/dal`

## Docs

- `docs/dal-guide.md`
- `docs/error-handling-guide.md`

## Contributing

1. Follow the TypeScript and tRPC patterns established in the codebase
2. Use the shared Zod schemas in `src/schemas` for inputs
3. Route all database access through the DAL in `src/db/dal`
4. Add translations for all new text content
5. Test thoroughly before submitting changes
