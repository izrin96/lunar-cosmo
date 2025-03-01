"use client";

import ObjektView from "@/components/objekt/objekt-view";
import { useFilters } from "@/hooks/use-filters";
import { ObjektModalProvider } from "@/hooks/use-objekt-modal";
import { shapeProgressCollections } from "@/lib/filter-utils";
import { collectionOptions, ownedCollectionOptions } from "@/lib/query-options";
import { CosmoArtistWithMembersBFF } from "@/lib/universal/cosmo/artists";
import { CosmoPublicUser } from "@/lib/universal/cosmo/auth";
import { QueryErrorResetBoundary, useQuery } from "@tanstack/react-query";
import React, { memo, useMemo, useState } from "react";
import ProgressFilter from "./progress-filter";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallbackRender from "@/components/error-fallback";
import { Loader, ProgressBar } from "@/components/ui";
import {
  IndexedObjekt,
  OwnedObjekt,
  unobtainables,
} from "@/lib/universal/objekts";
import { IconExpand45, IconMinimize45 } from "justd-icons";

type Props = {
  artists: CosmoArtistWithMembersBFF[];
  profile: CosmoPublicUser;
};

export default function ProgressRender({ ...props }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={ErrorFallbackRender}>
          <Progress {...props} />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

function Progress({ artists, profile }: Props) {
  const [filters] = useFilters();

  const objektsQuery = useQuery(collectionOptions);
  const ownedQuery = useQuery(ownedCollectionOptions(profile.address));

  const objekts = useMemo(() => objektsQuery.data ?? [], [objektsQuery.data]);
  const ownedObjekts = useMemo(() => ownedQuery.data ?? [], [ownedQuery.data]);

  const shaped = useMemo(
    () => shapeProgressCollections(artists, filters, objekts),
    [artists, filters, objekts]
  );

  if (objektsQuery.isLoading || ownedQuery.isLoading)
    return (
      <div className="justify-center flex">
        <Loader variant="ring" />
      </div>
    );

  return (
    <ObjektModalProvider initialTab="trades">
      <div className="flex flex-col gap-8 mb-8">
        <ProgressFilter artists={artists} />
        {!filters.artist && !filters.member ? (
          <div className="flex justify-center text-sm text-muted-fg">
            Select at least 1 artist or 1 member
          </div>
        ) : (
          shaped.map(([key, objekts]) => {
            return (
              <ProgressCollapse
                key={key}
                title={key}
                objekts={objekts}
                ownedObjekts={ownedObjekts}
              />
            );
          })
        )}
      </div>
    </ObjektModalProvider>
  );
}

const ProgressCollapse = memo(function ProgressCollapse({
  title,
  objekts,
  ownedObjekts,
}: {
  title: string;
  objekts: IndexedObjekt[];
  ownedObjekts: OwnedObjekt[];
}) {
  const [show, setShow] = useState(false);

  const filteredObjekts = useMemo(
    () => objekts.filter((a) => !unobtainables.includes(a.slug)),
    [objekts]
  );

  const ownedSlugs = useMemo(
    () => new Set(ownedObjekts.map((obj) => obj.slug)),
    [ownedObjekts]
  );

  const owned = useMemo(
    () => filteredObjekts.filter((a) => ownedSlugs.has(a.slug)),
    [filteredObjekts, ownedSlugs]
  );

  const percentage = useMemo(() => {
    const percentage = Math.floor(
      (owned.length / filteredObjekts.length) * 100
    );
    return isNaN(percentage) ? 0 : percentage;
  }, [owned, filteredObjekts]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex gap-4 py-4 flex-wrap cursor-pointer select-none items-center transition rounded-lg p-4 border border-border bg-secondary/30 hover:bg-secondary/60"
        onClick={() => setShow(!show)}
      >
        <div className="font-semibold text-base inline-flex gap-2 items-center min-w-72">
          {title}
          {show ? <IconMinimize45 /> : <IconExpand45 />}
        </div>
        <ProgressBar
          aria-label="Progress Bar"
          className="min-w-[240px]"
          valueLabel={`${owned.length}/${filteredObjekts.length} (${percentage}%)`}
          value={percentage}
        />
      </div>
      {show && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 lg:gap-4">
          {objekts.map((objekt) => (
            <ObjektView
              key={objekt.slug}
              objekts={[objekt]}
              isFade={!ownedSlugs.has(objekt.slug)}
              unobtainable={unobtainables.includes(objekt.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
});
