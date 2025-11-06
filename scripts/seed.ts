import { config } from 'dotenv';
import { resolve } from 'path';
import { db } from '../db';
import { users } from '../db/schema';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local');
  }

  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, adminEmail),
  });

  if (existingUser) {
    console.log('Admin user already exists');
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const userId = createId();

  await db.insert(users).values({
    id: userId,
    name: 'Admin',
    email: adminEmail,
    passwordHash,
    role: 'admin',
  });

  console.log('Admin user created successfully');
}

seed()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

