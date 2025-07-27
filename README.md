# VideoAch - Coaching Platform

A modern Next.js 15 application with TypeScript, Tailwind CSS, Drizzle ORM, and tRPC for type-safe APIs.

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Drizzle ORM
- **API**: tRPC for type-safe APIs
- **State Management**: React Query (TanStack Query)
- **Validation**: Zod
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
- **`src/app/layout.tsx`**: Root layout with tRPC provider

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
└── server/                # Server-side code
    └── api/               # tRPC routers
        ├── root.ts        # Root router
        └── routers/       # Individual routers
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
4. Test thoroughly before submitting changes
