"use client";

import { IndexedObjekt } from "@/lib/universal/objekts";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import FilterView from "../filters/filter-render";
import { useFilters } from "@/hooks/use-filters";
import { GRID_COLUMNS_MOBILE } from "@/lib/utils";
import ObjektView from "../objekt/objekt-view";
import { shapeIndexedObjekts } from "@/lib/filter-utils";
import { WindowVirtualizer } from "virtua";
import { ObjektModalProvider } from "@/hooks/use-objekt-modal";
import { useMediaQuery } from "usehooks-ts";
import { cn } from "@/utils/classes";
import {
  QueryErrorResetBoundary,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { collectionOptions } from "@/lib/query-options";
import ErrorFallbackRender from "../error-fallback";
import { useCosmoArtist } from "@/hooks/use-cosmo-artist";

export default function IndexRender() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={ErrorFallbackRender}>
          <IndexView />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

function IndexView() {
  const { artists } = useCosmoArtist();
  const [filters] = useFilters();
  const { data: objekts } = useSuspenseQuery(collectionOptions);

  const isDesktop = useMediaQuery("(min-width: 640px)");
  const columns = isDesktop ? filters.column : GRID_COLUMNS_MOBILE;

  const [objektsFiltered, setObjektsFiltered] = useState<
    [string, IndexedObjekt[]][]
  >([]);
  const deferredObjektsFiltered = useDeferredValue(objektsFiltered);

  const virtualList = useMemo(() => {
    return deferredObjektsFiltered.flatMap(([key, objekts]) => [
      GroupLabelRender({ key }),
      ...ObjektsRender({ objekts, columns, key }),
    ]);
  }, [deferredObjektsFiltered, columns]);

  const count = useMemo(
    () => deferredObjektsFiltered.flatMap(([, objekts]) => objekts).length,
    [deferredObjektsFiltered]
  );

  useEffect(() => {
    setObjektsFiltered(shapeIndexedObjekts(filters, objekts, artists));
  }, [filters, objekts, artists]);

  return (
    <div className="flex flex-col gap-2">
      <FilterView artists={artists} />
      <span className="font-semibold">{count} total</span>

      <ObjektModalProvider initialTab="trades">
        <WindowVirtualizer>{virtualList}</WindowVirtualizer>
      </ObjektModalProvider>
    </div>
  );
}

export function GroupLabelRender({ key }: { key: string }) {
  return (
    <div
      key={key}
      className={cn("font-semibold text-base pb-3 pt-3", !key && "hidden")}
    >
      {key}
    </div>
  );
}

function ObjektsRender({
  key,
  objekts,
  columns,
}: {
  key: string;
  objekts: IndexedObjekt[];
  columns: number;
}) {
  return Array.from({
    length: Math.ceil(objekts.length / columns),
  }).map((_, i) => {
    return (
      <ObjektsRowRender
        key={`${key}_${i}`}
        rowIndex={i}
        columns={columns}
        objekts={objekts}
      />
    );
  });
}

function ObjektsRowRender({
  rowIndex,
  objekts,
  columns,
}: {
  rowIndex: number;
  objekts: IndexedObjekt[];
  columns: number;
}) {
  return (
    <div className="flex gap-3 md:gap-4 pb-4">
      {Array.from({ length: columns }).map((_, j) => {
        const index = rowIndex * columns + j;
        const objekt = objekts[index];
        return (
          <div className="flex-1" key={j}>
            {objekt && (
              <ObjektView
                key={objekt.slug}
                objekts={[objekt]}
                priority={index < columns * 3}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
