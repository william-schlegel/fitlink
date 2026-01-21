import { desc, eq } from "drizzle-orm";

import { event } from "@/db/schema/club";
import { db } from "@/db";

// ==================== EVENT QUERIES ====================

export async function getEventById(id: string) {
  return db.query.event.findFirst({
    where: eq(event.id, id),
    with: { club: { with: { manager: true } } },
  });
}

export async function getEventsForClub(clubId: string) {
  return db.query.event.findMany({
    where: eq(event.clubId, clubId),
    orderBy: [desc(event.startDate)],
  });
}

// ==================== EVENT MUTATIONS ====================

export async function createEvent(data: {
  clubId: string;
  name: string;
  brief: string;
  description: string;
  startDate: Date;
  endDate: Date;
  startDisplay: Date;
  endDisplay: Date;
  bannerText: string;
  cancelled: boolean;
  imageUrls?: string[];
  price: number;
  free: boolean;
  address: string;
  searchAddress?: string | null;
  latitude: number;
  longitude: number;
}) {
  return db.insert(event).values(data);
}

export async function updateEvent(data: {
  id: string;
  clubId?: string;
  name?: string;
  brief?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  startDisplay?: Date;
  endDisplay?: Date;
  bannerText?: string;
  cancelled?: boolean;
  imageUrls?: string[];
  price?: number;
  free?: boolean;
  address?: string;
  searchAddress?: string | null;
  latitude?: number;
  longitude?: number;
}) {
  return db.update(event).set(data);
}

export async function deleteEvent(id: string) {
  return db.delete(event).where(eq(event.id, id));
}
