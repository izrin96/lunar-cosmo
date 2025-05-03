import { cacheHeaders } from "@/app/api/common";
import { db } from "@/lib/server/db";
import { indexer } from "@/lib/server/db/indexer";
import {
  objekts,
  transfers,
  collections,
} from "@/lib/server/db/indexer/schema";
import { and, eq, asc } from "drizzle-orm";

type Params = {
  params: Promise<{
    collectionSlug: string;
    serial: string;
  }>;
};

export async function GET(_: Request, props: Params) {
  const params = await props.params;

  const results = await indexer
    .select({
      tokenId: objekts.id,
      id: transfers.id,
      to: transfers.to,
      timestamp: transfers.timestamp,
      owner: objekts.owner,
      transferable: objekts.transferable,
    })
    .from(transfers)
    .leftJoin(objekts, eq(transfers.objektId, objekts.id))
    .leftJoin(collections, eq(objekts.collectionId, collections.id))
    .where(
      and(
        eq(collections.slug, params.collectionSlug),
        eq(objekts.serial, parseInt(params.serial))
      )
    )
    .orderBy(asc(transfers.timestamp), asc(transfers.id));

  const addresses = Array.from(new Set(results.map((r) => r.to)));

  const knownAddresses = await db.query.userAddress.findMany({
    where: (userAddress, { inArray }) =>
      inArray(userAddress.address, addresses),
  });

  const [result] = results;

  return Response.json(
    {
      tokenId: result?.tokenId ?? undefined,
      owner: result?.owner ?? undefined,
      transferable: result?.transferable ?? undefined,
      transfers: results.map((result) => ({
        id: result.id,
        to: result.to,
        timestamp: result.timestamp,
        nickname: knownAddresses.find(
          (a) => a.address.toLowerCase() === result.to.toLowerCase()
        )?.nickname,
      })),
    },
    {
      headers: cacheHeaders(),
    }
  );
}
