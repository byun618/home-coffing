import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export const notificationKeys = {
  all: ["notifications"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => api.get<NotificationItem[]>("/notifications"),
  });
}
