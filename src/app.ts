import { and, eq, gt, gte, isNull, like, or } from 'drizzle-orm';
import express, { Express } from 'express';

import { db } from '@/db/index.js';
import { posts, profiles, users } from '@/db/schema.js';
import { insertUserSchema } from '@/types/schema.js';

export const app: Express = express();

app.use(express.json());

app.get('/api/v1/users', async (_, res) => {
  const allUsers = await db.select().from(users);
  res.status(200).json({
    status: 'success',
    data: {
      users: allUsers,
    },
  });
});

app.get('/api/v1/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide a user id',
      });
      return;
    }

    const user = await db
      .select()
      .from(users)
      .where(
        and(
          gte(users.id, 5),
          or(gt(users.score, 70), like(users.fullName, '%e%')),
        ),
      );

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'User not found',
    });
  }
});

app.get('/api/v1/users/:id/profile', async (_, res) => {
  // const id = Number(req.params.id);
  // const results = await db.query.users.findMany({
  //   columns: {
  //     address: true,
  //   },
  //   where: ne(users.id, 4),
  //   with: {
  //     profile: true,
  //   },
  // });

  const profiles2 = await db
    .select({
      id: profiles.id,
      bio: profiles.bio,
      userId: profiles.userId,
      fullName: users.fullName,
      address: users.address,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(isNull(users.address));

  // const result = users.find((user) => user.id === id);

  res.status(200).json({
    status: 'success',
    data: {
      full_profiles: profiles2,
    },
  });
});

app.post('/api/v1/users', async (req, res) => {
  try {
    const newUser = insertUserSchema.parse(req.body);
    const insertedUser = await db
      .insert(users)
      .values(newUser)
      .returning({ insertedId: users.id });

    const newId = insertedUser[0].insertedId;
    await db.insert(profiles).values({
      userId: newId,
      bio: 'Hello world',
    });

    res.status(201).json({
      status: 'success',
      message: 'New user created',
      data: {
        newUser,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({
        status: 'fail',
        message: err.message,
      });
      return;
    }
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data',
    });
  }
});

app.get('/api/v1/users/:id/posts', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid user id',
      });
      return;
    }
    // const results = await db.query.users.findFirst({
    //   where: eq(users.id, id),
    //   with: {
    //     posts: true,
    //   },
    // });

    const results = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        results,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'User not found',
    });
  }
});
