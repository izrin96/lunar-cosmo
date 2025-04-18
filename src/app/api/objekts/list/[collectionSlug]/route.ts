import { indexer } from "@/lib/server/db/indexer";
import { and, asc, eq, not } from "drizzle-orm";
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
      serial: objekts.serial,
    })
    .from(objekts)
    .leftJoin(collections, eq(objekts.collectionId, collections.id))
    .where(
      and(
        eq(collections.slug, params.collectionSlug),
        not(eq(objekts.owner, SPIN_ADDRESS))
      )
    )
    .orderBy(asc(objekts.serial));

  return Response.json(
    {
      serials: results.map((a) => a.serial),
    },
    {
      headers: cacheHeaders(),
    }
  );
}
