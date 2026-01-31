import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { subscription } from "@/db/schema/subscription";
import { userMember, userMemberToSubscription } from "@/db/schema/user";
import { SubscriptionId, UserId } from "../types";

// ==================== MEMBER DATA ====================

export async function getMemberByUserId(userId: UserId) {
  return db.query.userMember.findFirst({
    where: eq(userMember.userId, userId),
  });
}

export async function createMember(userId: UserId) {
  return db.insert(userMember).values({ userId }).returning();
}

export async function getOrCreateMember(userId: UserId) {
  let member = await getMemberByUserId(userId);
  if (!member) {
    const newMember = await createMember(userId);
    member = newMember[0];
  }
  return member;
}

// ==================== MEMBER SUBSCRIPTIONS ====================

export async function addSubscriptionToMember(
  memberId: UserId,
  subscriptionId: SubscriptionId,
) {
  const existing = await db.query.userMemberToSubscription.findFirst({
    where: and(
      eq(userMemberToSubscription.userId, memberId),
      eq(userMemberToSubscription.subscriptionId, subscriptionId),
    ),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(userMemberToSubscription)
    .values({
      userId: memberId,
      subscriptionId,
    })
    .returning();

  return created;
}

export async function deleteMemberSubscription(
  userId: UserId,
  subscriptionId: SubscriptionId,
) {
  return db
    .delete(userMemberToSubscription)
    .where(
      and(
        eq(userMemberToSubscription.userId, userId),
        eq(userMemberToSubscription.subscriptionId, subscriptionId),
      ),
    );
}

// ==================== SUBSCRIPTION LOOKUP ====================

export async function getSubscriptionWithClub(subscriptionId: SubscriptionId) {
  return db.query.subscription.findFirst({
    where: eq(subscription.id, subscriptionId),
    with: { club: true },
  });
}
