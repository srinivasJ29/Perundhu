import { User } from '../models';
import { hashPassword } from '../modules/auth/auth.tokens';
import { connectDatabase, disconnectDatabase } from '../infrastructure/database';
import { env } from '../config/env';
import { logger } from '../common/logger';

export async function bootstrapAdmin(options: {
  email?: string;
  password?: string;
  fullName?: string;
}): Promise<void> {
  const email = (options.email || process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@tnstc.perundhu.gov.in')
    .trim()
    .toLowerCase();
  const password = options.password || process.env.ADMIN_BOOTSTRAP_PASSWORD || 'PerundhuAdmin@2026';
  const fullName = (options.fullName || process.env.ADMIN_BOOTSTRAP_NAME || 'TNSTC System Administrator').trim();

  if (password.length < 8) {
    throw new Error('Admin password must be at least 8 characters long');
  }

  await connectDatabase(env.MONGODB_URI);

  try {
    const passwordHash = await hashPassword(password);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.passwordHash = passwordHash;
      existingUser.fullName = fullName;
      existingUser.role = 'ADMIN';
      existingUser.status = 'ACTIVE';
      await existingUser.save();
      logger.info({ email, role: 'ADMIN' }, 'Existing user successfully promoted to ADMIN');
    } else {
      const admin = await User.create({
        email,
        passwordHash,
        fullName,
        role: 'ADMIN',
        status: 'ACTIVE'
      });
      logger.info({ id: admin._id, email, role: 'ADMIN' }, 'First administrator created successfully');
    }
  } finally {
    await disconnectDatabase();
  }
}

// CLI execution helper
if (require.main === module) {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const email = getArg('--email');
  const password = getArg('--password');
  const fullName = getArg('--name');

  bootstrapAdmin({ email, password, fullName })
    .then(() => {
      logger.info('Administrator bootstrap completed.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Administrator bootstrap failed');
      process.exit(1);
    });
}
