import { db } from '@/db';
import { collections } from '@/db/schema';
import { collectionCreateSchema } from '@/lib/validators/register';
import { getServerSession } from 'next-auth';
import z from 'zod';
import { authOptions } from '../auth/[...nextauth]/authOptions';

export default async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response('Unauthorized', { status: 403 });
    }

    const { user } = session;

    const userEntry = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, user?.email as string),
    });

    if (!userEntry) {
      return new Response('User not found!', { status: 404 });
    }

    // Parse and validate input
    const json = await req.json();
    const { title } = collectionCreateSchema.parse(json);

    // Create new collection entry in db linked to user
    const collection = await db.insert(collections).values({ title, userId: userEntry?.id });

    return new Response(JSON.stringify(collection), { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    return new Response(null, { status: 500 });
  }
}
