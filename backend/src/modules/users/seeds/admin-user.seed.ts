import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const passwordHash = await bcrypt.hash('Admin123', 10);

  await dataSource.query(`
    INSERT INTO users (id, email, "fullName", role, "passwordHash", phone)
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      'admin@fge.gt',
      'Administrador FGE',
      'admin',
      '${passwordHash}',
      null
    )
    ON CONFLICT (id) DO NOTHING
  `);
}
