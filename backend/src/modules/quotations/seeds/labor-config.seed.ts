import { DataSource } from 'typeorm';

export async function seedLaborConfigs(dataSource: DataSource): Promise<void> {
  const configs = [
    { id: '76f3f5fe-f064-4c14-91d7-59007acdd42e', projectType: 'economica', label: 'Vivienda económica', percentage: 0.35 },
    { id: '2e03bb67-c95b-447b-9f79-a8f2ebbe6e7e', projectType: 'media', label: 'Vivienda media', percentage: 0.40 },
    { id: 'f76044cb-adc8-4a4b-9fa6-3d9fb7fcd520', projectType: 'ampliacion', label: 'Ampliación', percentage: 0.30 },
    { id: '8f4d0080-a954-4eb5-9c62-35f31f75f159', projectType: 'obra_gris', label: 'Obra gris', percentage: 0.25 },
  ];

  for (const config of configs) {
    await dataSource.query(
      `
        INSERT INTO labor_configs (id, "projectType", label, percentage, "isActive")
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT ("projectType") DO NOTHING
      `,
      [config.id, config.projectType, config.label, config.percentage],
    );
  }
}
