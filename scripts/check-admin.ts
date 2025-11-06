import { db } from '../db';
import { users } from '../db/schema';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function checkAndCreateAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('ADMIN_EMAIL and ADMIN_PASSWORD not set, skipping admin creation');
    return;
  }

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (existingUser) {
      console.log(`Admin user ${adminEmail} already exists`);
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

    console.log(`Admin user ${adminEmail} created successfully`);
  } catch (error) {
    console.error('Error checking/creating admin user:', error);
  }
}

checkAndCreateAdmin()
  .then(() => {
    console.log('Admin check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Admin check failed:', error);
    process.exit(1);
  });

