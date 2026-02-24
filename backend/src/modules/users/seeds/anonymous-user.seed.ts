import { DataSource } from 'typeorm';

export async function seedAnonymousUser(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    `INSERT INTO users (id, email, "fullName", role, "passwordHash")
     VALUES ('00000000-0000-0000-0000-000000000000', 'anonymous@fge.gt', 'Usuario Anónimo', 'client', null)
     ON CONFLICT (id) DO NOTHING`,
  );
}
