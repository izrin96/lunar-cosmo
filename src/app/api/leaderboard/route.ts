import { indexer } from "@/lib/server/db/indexer";
import { and, count, eq, desc, not, inArray } from "drizzle-orm";
import { collections, objekts } from "@/lib/server/db/indexer/schema";
import { z } from "zod";
import {
  validArtists,
  validOnlineTypes,
  validSeasons,
} from "@/lib/universal/cosmo/common";
import { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { userAddress } from "@/lib/server/db/schema";
import { cacheHeaders } from "../common";
import { unobtainables } from "@/lib/universal/objekts";
import { SPIN_ADDRESS } from "@/lib/utils";

const schema = z.object({
  artist: z.enum(validArtists).nullable().optional(),
  member: z.string().nullable().optional(),
  onlineType: z.enum(validOnlineTypes).nullable().optional(),
  season: z.enum(validSeasons).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const parsedParams = schema.safeParse({
    ...Object.fromEntries(request.nextUrl.searchParams.entries()),
  });

  if (!parsedParams.success)
    return Response.json(
      {
        status: "error",
        validationErrors: parsedParams.error.flatten().fieldErrors,
      },
      {
        status: 400,
      }
    );

  const options = parsedParams.data;

  const wheres = and(
    not(inArray(collections.slug, unobtainables)),
    not(inArray(collections.class, ["Welcome", "Zero"])),
    ...(options.artist ? [eq(collections.artist, options.artist)] : []),
    ...(options.member ? [eq(collections.member, options.member)] : []),
    ...(options.season ? [eq(collections.season, options.season)] : []),
    ...(options.onlineType
      ? [eq(collections.onOffline, options.onlineType)]
      : [])
  );

  // get total collection
  const total = (
    await indexer
      .select({
        count: count(collections.id),
      })
      .from(collections)
      .where(wheres)
  )[0].count;

  // get leaderboard
  const subquery = indexer
    .selectDistinct({
      owner: objekts.owner,
      collectionId: objekts.collectionId,
    })
    .from(objekts)
    .leftJoin(collections, eq(objekts.collectionId, collections.id))
    .where(and(wheres, not(eq(objekts.owner, SPIN_ADDRESS))))
    .as("subquery");

  const query = await indexer
    .select({
      owner: subquery.owner,
      count: count(subquery.collectionId),
    })
    .from(subquery)
    .groupBy(subquery.owner)
    .orderBy(desc(count(subquery.collectionId)))
    .limit(1000);

  // fetch known address
  const knownAddresses = await db
    .select()
    .from(userAddress)
    .where(
      and(
        inArray(
          userAddress.address,
          query.map((a) => a.owner)
        )
      )
    );

  // map nickname from known address
  const results = query.map((q, i) => {
    return {
      rank: i + 1,
      count: q.count,
      address: q.owner,
      nickname: knownAddresses.find(
        (a) => a.address.toLowerCase() === q.owner.toLowerCase()
      )?.nickname,
    };
  });

  return Response.json(
    {
      total,
      results,
    },
    {
      headers: cacheHeaders(3600),
    }
  );
}
