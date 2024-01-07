import { and, eq, gt, gte, isNull, like, or } from 'drizzle-orm';
import express, { Express } from 'express';

import { db } from '@/db/index.js';
import {
  categories,
  posts,
  postsToCategories,
  profiles,
  users,
} from '@/db/schema.js';
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

app.get('/api/v1/users/:id/posts/:postId', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const postId = Number(req.params.postId);
    if (!id || !postId) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid user id and post id',
      });
      return;
    }

    // const results = await db.query.users.findMany({
    //   where: eq(users.id, id),
    //   with: {
    //     posts: {
    //       where: eq(posts.id, postId),
    //       with: {
    //         postsToCategories: {
    //           with: {
    //             category: true,
    //           },
    //         },
    //       },
    //     },
    //   },
    // });

    const results2 = await db.query.posts.findFirst({
      with: {
        author: true,
        postsToCategories: {
          columns: {
            categoryId: false,
            postId: false,
          },
          with: {
            category: {
              columns: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        results2,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Not found',
    });
  }
});

// POST
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

app.post('/api/v1/users/new/signup', async (_, res) => {
  try {
    const newUser = await db
      .insert(users)
      .values({
        fullName: 'user 2',
        address: 'address 2',
        phone: '8888',
        score: 50,
      })
      .returning({ userId: users.id });

    const userId = newUser[0].userId;

    // Add profiles (one to one)
    await db.insert(profiles).values({
      userId,
      bio: 'I am programmer!',
    });

    // Add posts (one to many)
    ['post1', 'post2', 'post3'].forEach(async (post) => {
      await db.insert(posts).values({
        text: post,
        authorId: userId,
      });
    });

    // Add categories (many to many)
    const newCats = await db
      .insert(categories)
      .values([{ name: 'cat 1' }, { name: 'cat 2' }])
      .returning({ catId: categories.id });

    const newPosts = await db
      .insert(posts)
      .values([
        {
          authorId: userId,
          text: 'post 4',
        },
        {
          authorId: userId,
          text: 'post 5',
        },
      ])
      .returning({ postId: posts.id });

    await db.insert(postsToCategories).values([
      {
        postId: newPosts[0].postId,
        categoryId: newCats[0].catId,
      },
      {
        postId: newPosts[0].postId,
        categoryId: newCats[1].catId,
      },
      {
        postId: newPosts[1].postId,
        categoryId: newCats[0].catId,
      },
      {
        postId: newPosts[1].postId,
        categoryId: newCats[1].catId,
      },
    ]);

    const result = await db.query.users.findMany({
      where: eq(users.id, userId),
      with: {
        profile: true,
        posts: {
          with: {
            postsToCategories: {
              columns: {},
              with: {
                category: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'New user created',
      data: {
        result,
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
