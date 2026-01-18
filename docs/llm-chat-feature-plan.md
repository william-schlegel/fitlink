# LLM Coach/Club Finder Chat - Implementation Plan

## Goals

- Let users chat to find a coach or club near them.
- The assistant asks for activity preferences and location, then queries the DB via MCP tools.
- Return ranked, actionable matches with links to profiles/pages.

## Assumptions (adjust if wrong)

- Dedicated assistant UI lives on the index page (not `/chat`).
- Data is in Postgres via Drizzle (`src/db/schema/`).
- Existing geocoding uses MapQuest via `src/components/ui/addressSearch.tsx`.
- Default search radius is 20km unless the user asks for a specific radius.
- Default max results is 20 unless the user asks for a specific limit.
- Assistant sessions live in Convex in dedicated tables (separate from chat).
- Gemini is the initial LLM provider; OpenAI adapter can be added later.

## Task Breakdown

1 - Product + UX decisions

- Entry point is the index page with an "LLM chat field" style assistant.
- Define minimum data required from user (activity, location, optional time/budget).
- Default ranking: activity match, then distance (unless user asks for a specific rule).
- Decide response format (cards, links, map, CTA).
- Reuse map UI patterns from `src/components/sections/findClub.tsx` and `src/components/sections/findCoach.tsx`.
- Guardrails: only fitness/coach/club queries; decline out-of-scope.

1. Data mapping and search design

- Identify join path for coach/club offerings and activity groups.
- Confirm location source (club sites `latitude/longitude` or coach market sites).
- Decide on geo query method (Haversine vs PostGIS) and required indexes.
- Document query inputs/outputs to match MCP tool schemas.
- Add location parsing rules:
  - If user provides a city/area, prefer that over browser geolocation.
  - If user mentions a Paris arrondissement (e.g., "12eme arrondissement"), assume Paris, France.
  - If no location is provided, use browser geolocation (with permission).
  - Reuse MapQuest geocoding flow from `AddressSearch` where possible.

2 - MCP server + tools

- Add an MCP server (Node/TS) that exposes read-only tools.
- Tool candidates:
  - `search_clubs({ activity, lat, lng, radius_km, limit })`
  - `search_coaches({ activity, lat, lng, radius_km, limit })`
  - `resolve_location({ address_or_city })` (MapQuest)
- Use Drizzle queries with strict allowlisted fields and pagination.
- Enforce default radius of 20km and max results of 20 when none are provided.

3 - LLM orchestration layer

- Implement Gemini provider adapter and server-side client/env vars.
- Create a system prompt that:
  - asks for missing activity/location details
  - calls MCP tools once enough info is gathered
  - summarizes results and proposes follow-up questions
- Add guardrails: only allow fitness/coach/club queries; decline out-of-scope.
- Persist conversation state in Convex using dedicated assistant tables with no TTL.
- Add guardrails: timeouts, rate limits, safe fallbacks, and PII handling.

4 - API integration

- Create a server endpoint (tRPC or route handler) that:
  - receives user messages
  - calls the LLM
  - proxies MCP tool calls
  - returns assistant messages and result payloads
- Add a way to create/find the assistant session in Convex.

5 - UI updates

- Add an "LLM chat field" assistant on the index page.
- Render assistant messages + result cards with distance and actions.
- Show results on a map using the same Mapbox setup as FindClub/FindCoach.
- Integrate optional location input (address + "use my location").
- Add translations for new UI copy in `messages/en.json` and `messages/fr.json`.

6 - Testing, monitoring, and rollout

- Unit tests for search query functions.
- Integration tests for LLM tool flow (mock MCP).
- Logging/metrics for tool usage, latency, and LLM cost.
- Feature flag for staged rollout.

## Open Questions

- What is the default max number of results to return?
- Sessions are retained indefinitely.
