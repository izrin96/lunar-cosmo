import { indexer } from "@/lib/server/db/indexer";
import { and, count, eq, not, sql } from "drizzle-orm";
import { collections, objekts } from "@/lib/server/db/indexer/schema";
import { cacheHeaders } from "@/app/api/common";
import { SPIN_ADDRESS } from "@/lib/utils";

type Params = {
  params: Promise<{
    collectionSlug: string;
  }>;
};

export async function GET(_: Request, props: Params) {
  const params = await props.params;

  const results = await indexer
    .select({
      total: count(),
      transferable:
        sql`count(case when transferable = true then 1 end)`.mapWith(Number),
    })
    .from(collections)
    .leftJoin(objekts, eq(collections.id, objekts.collectionId))
    .where(
      and(
        eq(collections.slug, params.collectionSlug),
        not(eq(objekts.owner, SPIN_ADDRESS))
      )
    )
    .groupBy(collections.id);
  const result = results[0];

  return Response.json(result, {
    headers: cacheHeaders(),
  });
}
