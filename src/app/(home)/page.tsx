import IndexView from "@/components/index/index-view";
import { getQueryClient } from "@/lib/query-client";
import { collectionOptions } from "@/lib/query-options";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export const revalidate = 0;

export default async function Home() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(collectionOptions);

  return (
    <>
      <div className="py-1"></div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <IndexView />
      </HydrationBoundary>
    </>
  );
}
