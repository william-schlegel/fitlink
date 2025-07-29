# VideoAch - Coaching Platform

A modern Next.js 15 application with TypeScript, Tailwind CSS, Drizzle ORM, tRPC for type-safe APIs, and next-intl for internationalization.

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Drizzle ORM
- **API**: tRPC for type-safe APIs
- **State Management**: React Query (TanStack Query)
- **Validation**: Zod
- **Internationalization**: next-intl
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up your environment variables in `.env`
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

The app includes a `LanguageSwitcher` component that allows users to switch between languages:

```typescript
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Use in any component
<LanguageSwitcher />;
```

## tRPC Setup

This project uses tRPC for type-safe APIs. The setup includes:

### Server-side Configuration

- **`src/lib/trpc/server.ts`**: Main tRPC server configuration
- **`src/server/api/root.ts`**: Root router combining all sub-routers
- **`src/server/api/routers/`**: Individual route handlers
- **`src/app/api/trpc/[trpc]/route.ts`**: Next.js API route handler

### Client-side Configuration

- **`src/lib/trpc/client.ts`**: tRPC client configuration
- **`src/lib/trpc/provider.tsx`**: React Query provider wrapper
- **`src/app/[locale]/layout.tsx`**: Root layout with tRPC and i18n providers

### Available Routes

#### Health Check

- `GET /api/trpc/health.check` - Basic health check endpoint

#### Users

- `GET /api/trpc/user.list` - List users with pagination
- `GET /api/trpc/user.getById` - Get user by ID
- `POST /api/trpc/user.create` - Create new user

### Usage Example

```typescript
// In a React component
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

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   └── trpc/          # tRPC API handler
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── db/                    # Database configuration
│   ├── schema.ts          # Drizzle schema
│   └── index.ts           # Database connection
├── lib/                   # Shared utilities
│   └── trpc/              # tRPC configuration
│       ├── client.ts      # Client setup
│       ├── server.ts      # Server setup
│       └── provider.tsx   # React provider
├── server/                # Server-side code
│   └── api/               # tRPC routers
│       ├── root.ts        # Root router
│       └── routers/       # Individual routers
└── i18n.ts               # Internationalization config

messages/
├── fr.json               # French translations
└── en.json              # English translations
```

## Development

- **Build**: `bun run build`
- **Lint**: `bun run lint`
- **Dev**: `bun run dev`

## Database

The project uses Drizzle ORM with PostgreSQL. The schema is defined in `src/db/schema.ts` and includes:

- User management with roles
- Coaching and subscription models
- File upload and document management
- Notification system

## Contributing

1. Follow the TypeScript and tRPC patterns established in the codebase
2. Use proper Zod validation for all inputs
3. Follow the existing database schema patterns
4. Add translations for all new text content
5. Test thoroughly before submitting changes

## Translation Guidelines

When adding new features:

1. Add translation keys to both `messages/fr.json` and `messages/en.json`
2. Use the `useTranslations` hook in components
3. Follow the existing translation structure
4. Use descriptive key names (e.g., `users.createButton` instead of `create`)
5. Test both languages to ensure consistency
