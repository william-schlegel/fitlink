import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { subscription } from "@/db/schema/subscription";
import { userMember, userMemberToSubscription } from "@/db/schema/user";

// ==================== MEMBER DATA ====================

export async function getMemberByUserId(userId: string) {
  return db.query.userMember.findFirst({
    where: eq(userMember.userId, userId),
  });
}

export async function createMember(userId: string) {
  return db.insert(userMember).values({ userId }).returning();
}

export async function getOrCreateMember(userId: string) {
  let member = await getMemberByUserId(userId);
  if (!member) {
    const newMember = await createMember(userId);
    member = newMember[0];
  }
  return member;
}

// ==================== MEMBER SUBSCRIPTIONS ====================

export async function addSubscriptionToMember(
  memberId: string,
  subscriptionId: string,
) {
  return db.insert(userMemberToSubscription).values({
    userId: memberId,
    subscriptionId,
  });
}

export async function deleteMemberSubscription(
  userId: string,
  subscriptionId: string,
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

export async function getSubscriptionWithClub(subscriptionId: string) {
  return db.query.subscription.findFirst({
    where: eq(subscription.id, subscriptionId),
    with: { club: true },
  });
}
