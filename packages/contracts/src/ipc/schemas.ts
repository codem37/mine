import { z } from "zod";
import { LOAD_STATES } from "../types/navigation.js";
import type { NavigationState } from "../types/navigation.js";
import type { TabSnapshot } from "../types/tab.js";

export const TabIdSchema = z.string().min(1);

export const UrlSchema = z.url();

export const LoadStateSchema = z.enum(LOAD_STATES);

export const NavigateRequestSchema = z.object({
  tabId: TabIdSchema,
  url: UrlSchema,
});

export type NavigateRequest = z.infer<typeof NavigateRequestSchema>;

export const TabIdRequestSchema = z.object({
  tabId: TabIdSchema,
});

export type TabIdRequest = z.infer<typeof TabIdRequestSchema>;

export const NewTabRequestSchema = z.object({
  url: UrlSchema.optional(),
});

export type NewTabRequest = z.infer<typeof NewTabRequestSchema>;

export const TabSnapshotSchema: z.ZodType<TabSnapshot> = z.object({
  id: TabIdSchema,
  url: UrlSchema,
  title: z.string(),
  loadState: LoadStateSchema,
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
});

export const TabListSchema = z.array(TabSnapshotSchema);

export const TabsUpdatedPayloadSchema = z.object({
  tabs: TabListSchema,
  activeTabId: TabIdSchema.nullable(),
});

export type TabsUpdatedPayload = z.infer<typeof TabsUpdatedPayloadSchema>;

export const NavigationStateSchema: z.ZodType<NavigationState> = z.object({
  url: UrlSchema,
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
  loadState: LoadStateSchema,
  errorCode: z.number().int().optional(),
});
