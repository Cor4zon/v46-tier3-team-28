import { db } from '@/db';
import { collections } from '@/db/schema';
import { collectionPatchSchema } from '@/lib/validators/collections';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import z from 'zod';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { routeContextSchema } from '@/lib/validators/collections';

export async function PATCH(req: Request, context: z.infer<typeof routeContextSchema>) {
  try {
    // validate route params
    const { params } = routeContextSchema.parse(context);
    console.log('here', params);
    // check if user has access to collection
    if (!(await verifyIfUserHasAccess(params.collectionId))) {
      return new Response(null, { status: 403 });
    }

    // Get request body and validate it
    const body = await req.json();
    const payload = collectionPatchSchema.parse(body);

    // Update the post
    await db
      .update(collections)
      .set({
        title: payload.title,
        private: payload.private,
      })
      .where(eq(collections.id, parseInt(params.collectionId)));

    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    return new Response(null, { status: 500 });
  }
}

export async function DELETE(req: Request, context: z.infer<typeof routeContextSchema>) {
  try {
    // Validate params
    const { params } = routeContextSchema.parse(context);

    // Check if user has access
    if (!(await verifyIfUserHasAccess(params.collectionId))) {
      return new Response(null, { status: 403 });
    }

    // Delete collection
    await db.delete(collections).where(eq(collections.id, parseInt(params.collectionId)));

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    return new Response(null, { status: 500 });
  }
}

async function verifyIfUserHasAccess(collectionId: string) {
  const session = await getServerSession(authOptions);
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(collections)
    .where(sql`${collections.id} = ${parseInt(collectionId)} and ${collections.userId} = ${session?.user.id}`);

  const { count } = result[0];
  return count > 0;
}
