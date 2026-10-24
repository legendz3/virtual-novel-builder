import type { PostHog } from "posthog-js/dist/module.no-external";
import {
  ChapterAnalytics,
  type ChapterAnalyticsEvent,
  type ChapterAnalyticsProperties,
} from "./chapterAnalytics";

interface PostHogConfiguration {
  token: string;
  host: string;
}
export function posthogConfiguration(raw: Record<string, unknown>): PostHogConfiguration | null {
  const token =
    typeof raw.VITE_POSTHOG_PROJECT_TOKEN === "string" ? raw.VITE_POSTHOG_PROJECT_TOKEN.trim() : "";
  const host = typeof raw.VITE_POSTHOG_HOST === "string" ? raw.VITE_POSTHOG_HOST.trim() : "";
  // Only a public ingestion token belongs in browser code. Missing/invalid telemetry fails open for gameplay.
  return raw.VITE_POSTHOG_ENABLED === "true" &&
    /^phc_[\w-]+$/.test(token) &&
    ["https://us.i.posthog.com", "https://eu.i.posthog.com"].includes(host)
    ? { token, host }
    : null;
}

let posthogClient: Promise<PostHog> | undefined;
// Share one lazy initialization; disabled analytics and visits before Begin download no SDK.
function loadPostHogClient(configuration: PostHogConfiguration): Promise<PostHog> {
  posthogClient ??= import("posthog-js/dist/module.no-external")
    .then(({ default: posthog }) => {
      posthog.init(configuration.token, {
        api_host: configuration.host,
        persistence: "localStorage",
        person_profiles: "identified_only",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_dead_clicks: false,
        rageclick: false,
        capture_exceptions: false,
        capture_heatmaps: false,
        capture_performance: false,
        disable_session_recording: true,
        disable_surveys: true,
        advanced_disable_flags: true,
        respect_dnt: true,
        save_referrer: false,
        save_campaign_params: false,
        store_google: false,
        // Do not send OAuth URL fragments, query strings or referrer URLs.
        property_denylist: [
          "$current_url",
          "$initial_current_url",
          "$referrer",
          "$initial_referrer",
        ],
        before_send: (payload) => {
          if (!payload) return payload;
          // Initial person properties bypass property_denylist in the SDK, so scrub those too.
          for (const bag of [
            payload.properties,
            payload.$set,
            payload.$set_once,
            payload.properties.$set,
            payload.properties.$set_once,
          ]) {
            if (!bag || typeof bag !== "object") continue;
            for (const key of [
              "$current_url",
              "$initial_current_url",
              "$referrer",
              "$initial_referrer",
            ])
              delete (bag as Record<string, unknown>)[key];
          }
          return payload;
        },
      });
      return posthog;
    })
    .catch((error: unknown) => {
      posthogClient = undefined;
      throw error;
    });
  return posthogClient;
}

function captureChapterEvent(
  event: ChapterAnalyticsEvent,
  properties: ChapterAnalyticsProperties,
  ownerId?: string,
): void {
  const configuration = posthogConfiguration(import.meta.env);
  if (!configuration) return;
  const environment =
    ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) ||
    import.meta.env.VITE_APP_ENV === "test" ||
    import.meta.env.DEV
      ? "test"
      : "production";
  // Promise callbacks retain capture order and each event's owner while the SDK loads.
  void loadPostHogClient(configuration)
    .then((posthog) => {
      const identifiedOwner = posthog.get_property("$user_id") as string | undefined;
      if (identifiedOwner && identifiedOwner !== ownerId) posthog.reset(true);
      if (ownerId && posthog.get_distinct_id() !== ownerId) posthog.identify(ownerId);
      posthog.capture(event, { ...properties, environment });
    })
    .catch(() => {
      /* Loading or capture failure is best effort and never interrupts gameplay. */
    });
}

export function createChapterAnalytics(): ChapterAnalytics {
  return new ChapterAnalytics({
    enabled: () => posthogConfiguration(import.meta.env) !== null,
    capture: captureChapterEvent,
    read: (key) => localStorage.getItem(key),
    write: (key, value) => localStorage.setItem(key, value),
    now: Date.now,
    // LAN phone previews may use HTTP, where randomUUID is unavailable. This ID is not an auth credential.
    uuid: () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  });
}
