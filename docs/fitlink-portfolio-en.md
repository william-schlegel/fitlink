# Fitlink Application Portfolio

## 1. Project Overview
Fitlink is a full-stack sports and coaching platform built to connect **members**, **coaches**, **club managers**, and **administrators** in one shared digital ecosystem.

The application combines:
- member-facing discovery and booking flows,
- coach professional pages and planning tools,
- manager operations (clubs, sites, rooms, events, subscriptions),
- admin-level supervision and KPI-oriented dashboards.

Fitlink is designed as a modular SaaS-style product for fitness clubs and coaching businesses that need both operational management and user engagement.

![Fitlink home screen](../public/images/Image.png)

## 2. Product Vision and Value
The core vision of Fitlink is to simplify how sport organizations manage their day-to-day activity while improving the experience for members.

### Main business outcomes
- Better fill rate for classes through clearer planning and reservation flows.
- Better retention through subscription visibility and personalized member space.
- Better coach visibility with public pages, offers, and certifications.
- Better management efficiency with centralized dashboards and role-based access.

### Main user roles
- **Member**: browse clubs/coaches, subscribe, reserve classes, track schedule.
- **Coach**: manage certifications, activity groups, offers, and planning.
- **Manager**: manage clubs, sites, rooms, pricing/subscriptions, and events.
- **Admin**: monitor global activity across the platform.

## 3. Key Functional Areas
### 3.1 Discovery and Onboarding
- Landing page with dedicated paths for visitor, manager, and coach.
- Internationalized experience (French and English).
- Authentication and account flows with secure role-based redirection.

### 3.2 Member Experience
- Personal dashboard with active subscriptions.
- Daily planning view and reservation tracking.
- Reservation detail dialogs (time, coach, site, room) and cancellation actions.
- Subscription management and self-service flows.

### 3.3 Coach Experience
- Coach dashboard with operational KPIs (clubs, certifications, activities, offers, ratings).
- Club collaboration visibility.
- Daily planning by day selector.
- Professional page management and publication status.

### 3.4 Manager Experience
- Manager dashboard with key counts (clubs, sites, rooms, activities, subscriptions, members).
- Planning by selected date.
- Event lifecycle management (create, update, delete, preview).
- Club operations management (multi-site and room-level organization).

![Fitlink dashboard-style view](../public/images/image2.png)

## 4. Technology and Architecture
Fitlink is built with a modern TypeScript-first architecture:

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui.
- **Backend/API**: tRPC for end-to-end typed procedures + Next route handlers.
- **Data layer**: PostgreSQL with Drizzle ORM and a dedicated DAL.
- **Authentication**: better-auth (email/password, magic link, provider-based auth).
- **Realtime features**: Convex for messaging and notifications.
- **Payments**: Stripe integration for subscription/payment workflows.
- **Files and media**: UploadThing.
- **Validation**: shared Zod schemas across layers.
- **i18n**: next-intl with bilingual messaging packs.

This architecture enables high development speed while preserving strong type safety and maintainability.

## 5. Reliability, Security, and Product Quality
- Role-based route protection and guarded dashboards.
- Typed contracts from UI to database reduce runtime mismatch risk.
- Modular DAL and schema-based validation simplify long-term maintenance.
- Internationalization built into the core UX (not a late add-on).
- Extensible platform design ready for additional premium features.

## 6. Current Scope and Evolution Potential
### Already in scope
- Multi-role dashboards.
- Planning and reservation workflows.
- Event and subscription management.
- Chat/assistant foundations and real-time infrastructure.
- Payment and notification foundations.

### Recommended next portfolio highlights
- KPI cards with business impact metrics (conversion, retention, occupancy).
- Advanced planning analytics for peak-hour optimization.
- More automation around coach-member communication.

## 7. Conclusion
Fitlink is a robust and scalable platform that bridges operational management and member engagement in the sports domain.

From a portfolio perspective, it demonstrates:
- a complete role-based product strategy,
- end-to-end full-stack engineering capability,
- production-ready architecture choices,
- and a clear path toward monetization and growth.

![Sports and activity visual](../images sport/activities.jpeg)
