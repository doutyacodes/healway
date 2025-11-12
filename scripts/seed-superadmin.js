// FILE: scripts/seed-superadmin.js
import { getDb } from '../lib/db/index.js';
import { superAdmins } from '../lib/db/schema.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seedSuperAdmin() {
  try {
    const db = await getDb();

    const email = 'superadmin@healway.com';
    const password = 'admin123';

    // Check if super admin already exists
    const [existing] = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.email, email))
      .limit(1);

    if (existing) {
      console.log('✅ Super Admin already exists');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert super admin
    await db.insert(superAdmins).values({
      name: 'Super Administrator',
      email: email,
      password: hashedPassword,
      isActive: true,
    });

    console.log('✅ Super Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n🔐 Please change the password after first login');
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
  } finally {
    process.exit(0);
  }
}

seedSuperAdmin();