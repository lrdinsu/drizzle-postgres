import {
  bigint,
  bigserial,
  boolean,
  char,
  date,
  doublePrecision,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  varchar,
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: varchar('phone', { length: 256 }),
  address: varchar('address', { length: 256 }),
});

export const moodEnum = pgEnum('mood', ['sad', 'ok', 'happy']);

export const testTable = pgTable('test_table', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  qty: bigint('qty', { mode: 'number' }),
  price: numeric('price', { precision: 7, scale: 2 }), //12345.67
  score: doublePrecision('score'),
  delivered: boolean('delivered'),
  // description: text("description"),
  description: varchar('description', { length: 256 }),
  name: char('name', { length: 10 }), //"chair" => "chair      "
  data: jsonb('data').notNull(),
  startAt: time('start_at', {
    precision: 3,
    withTimezone: true,
  }).defaultNow(),
  date: date('date', { mode: 'date' }).defaultNow(),
  mood: moodEnum('mood').default('happy'),
});
