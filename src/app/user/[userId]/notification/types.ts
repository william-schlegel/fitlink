export type FromTo = "from" | "to";

export type NotificationType =
  | "SEARCH_COACH"
  | "SEARCH_CLUB"
  | "COACH_ACCEPT"
  | "COACH_REFUSE"
  | "CLUB_ACCEPT"
  | "CLUB_REFUSE"
  | "NEW_MESSAGE"
  | "NEW_SUBSCRIPTION"
  | "NEW_REQUEST"
  | "SUBSCRIPTION_VALIDATED"
  | "SUBSCRIPTION_REJECTED"
  | "REQUEST_VALIDATED"
  | "REQUEST_REJECTED";

export const NOTIFICATION_TYPES: readonly {
  readonly value: NotificationType;
  readonly label: string;
}[] = [
  {
    value: "SEARCH_COACH",
    label: "notification.type.search-coach",
  },
  {
    value: "COACH_ACCEPT",
    label: "notification.type.coach-accept",
  },
  {
    value: "COACH_REFUSE",
    label: "notification.type.coach-refuse",
  },
  {
    value: "SEARCH_CLUB",
    label: "notification.type.search-club",
  },
  {
    value: "CLUB_ACCEPT",
    label: "notification.type.club-accept",
  },
  {
    value: "CLUB_REFUSE",
    label: "notification.type.club-refuse",
  },
  {
    value: "NEW_MESSAGE",
    label: "notification.type.new-message",
  },
  {
    value: "NEW_SUBSCRIPTION",
    label: "notification.type.new-subscription",
  },
  {
    value: "NEW_REQUEST",
    label: "notification.type.new-request",
  },
  {
    value: "SUBSCRIPTION_VALIDATED",
    label: "notification.type.subscription-validated",
  },
  {
    value: "SUBSCRIPTION_REJECTED",
    label: "notification.type.subscription-rejected",
  },
  {
    value: "REQUEST_VALIDATED",
    label: "notification.type.request-validated",
  },
  {
    value: "REQUEST_REJECTED",
    label: "notification.type.request-rejected",
  },
];
