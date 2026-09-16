/**
 * SSR-safe entry point for the map. Leaflet touches `window` at import time,
 * so the real component is code-split and only imported in the browser.
 */
import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import type { MapViewProps } from "./map-view";

const MapView = lazy(() => import("./map-view"));

function MapSkeleton() {
  return (
    <div className="grid-backdrop flex h-full w-full items-center justify-center bg-surface">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Initialising map engine…
      </div>
    </div>
  );
}

export function MapSurface(props: MapViewProps) {
  return (
    <ClientOnly fallback={<MapSkeleton />}>
      <Suspense fallback={<MapSkeleton />}>
        <MapView {...props} />
      </Suspense>
    </ClientOnly>
  );
}

export type { MapFocus, MapViewProps } from "./map-view";