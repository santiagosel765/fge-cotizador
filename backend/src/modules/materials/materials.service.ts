import { Injectable, NotFoundException, ConflictException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaterialCategory } from './entities/material-category.entity';
import { Material } from './entities/material.entity';
import { CreateMaterialCategoryDto } from './dto/create-material-category.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService implements OnApplicationBootstrap {

  constructor(
    @InjectRepository(MaterialCategory)
    private readonly categoriesRepo: Repository<MaterialCategory>,
    @InjectRepository(Material)
    private readonly materialsRepo: Repository<Material>,
  ) {}

  // ─── Se ejecuta automáticamente al iniciar la app ─────────────────────────
  async onApplicationBootstrap(): Promise<void> {
    await this.seedCatalog();
  }

  // ─── CATEGORÍAS ───────────────────────────────────────────────────────────

  async createCategory(dto: CreateMaterialCategoryDto): Promise<MaterialCategory> {
    const exists = await this.categoriesRepo.findOneBy({ code: dto.code });
    if (exists) throw new ConflictException(`Categoría con code '${dto.code}' ya existe`);
    const category = this.categoriesRepo.create(dto);
    return this.categoriesRepo.save(category);
  }

  async findAllCategories(): Promise<MaterialCategory[]> {
    return this.categoriesRepo.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['materials'],
    });
  }

  async findOneCategory(id: string): Promise<MaterialCategory> {
    const category = await this.categoriesRepo.findOne({
      where: { id },
      relations: ['materials'],
    });
    if (!category) throw new NotFoundException(`Categoría ${id} no encontrada`);
    return category;
  }

  // ─── MATERIALES ───────────────────────────────────────────────────────────

  async create(dto: CreateMaterialDto): Promise<Material> {
    const exists = await this.materialsRepo.findOneBy({ legacyCode: dto.legacyCode });
    if (exists) throw new ConflictException(`Material con legacyCode '${dto.legacyCode}' ya existe`);
    const categoryExists = await this.categoriesRepo.findOneBy({ id: dto.categoryId });
    if (!categoryExists) throw new NotFoundException(`Categoría ${dto.categoryId} no encontrada`);
    const material = this.materialsRepo.create(dto);
    return this.materialsRepo.save(material);
  }

  async findAll(categoryCode?: string): Promise<Material[]> {
    const qb = this.materialsRepo.createQueryBuilder('m')
      .leftJoinAndSelect('m.category', 'c')
      .where('m.isActive = true')
      .orderBy('c.sortOrder', 'ASC')
      .addOrderBy('m.name', 'ASC');

    if (categoryCode) {
      qb.andWhere('c.code = :categoryCode', { categoryCode });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Material> {
    const material = await this.materialsRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!material) throw new NotFoundException(`Material ${id} no encontrado`);
    return material;
  }

  async findByLegacyCode(legacyCode: string): Promise<Material> {
    const material = await this.materialsRepo.findOne({
      where: { legacyCode },
      relations: ['category'],
    });
    if (!material) throw new NotFoundException(`Material con código ${legacyCode} no encontrado`);
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto): Promise<Material> {
    const material = await this.findOne(id);
    Object.assign(material, dto);
    return this.materialsRepo.save(material);
  }

  async remove(id: string): Promise<void> {
    const material = await this.findOne(id);
    material.isActive = false;
    await this.materialsRepo.save(material);
  }

  // ─── SEED DEL CATÁLOGO ────────────────────────────────────────────────────

  async seedCatalog(): Promise<void> {
    const count = await this.materialsRepo.count();
    if (count > 0) return; // Ya existe data, no re-seedear

    // 1. Crear categorías en orden
    const categoriesData = [
      { code: 'obra_gris', name: 'Obra Gris', sortOrder: 1 },
      { code: 'plomeria_tuberia', name: 'Plomería y Drenajes', sortOrder: 2 },
      { code: 'plomeria_artefactos', name: 'Plomería - Artefactos', sortOrder: 3 },
      { code: 'electricidad_canalizacion', name: 'Electricidad - Canalización', sortOrder: 4 },
      { code: 'electricidad_acabados', name: 'Electricidad - Acabados y Controles', sortOrder: 5 },
      { code: 'acabados', name: 'Acabados Generales', sortOrder: 6 },
      { code: 'aberturas', name: 'Ventanas y Puertas', sortOrder: 7 },
    ];

    const categoryMap = new Map<string, string>(); // code -> uuid

    for (const catData of categoriesData) {
      let cat = await this.categoriesRepo.findOneBy({ code: catData.code });
      if (!cat) {
        cat = await this.categoriesRepo.save(this.categoriesRepo.create(catData));
      }
      categoryMap.set(cat.code, cat.id);
    }

    // 2. Insertar los 42 materiales del catálogo
    const materialsData = [
      // OBRA GRIS
      { legacyCode: 'cem-01', category: 'obra_gris', name: 'Bolsa de Cemento UGC 3000 PSI', unit: 'Bolsa 42.5kg', price: 85.00 },
      { legacyCode: 'hie-01', category: 'obra_gris', name: 'Quintal de Hierro Legítimo 3/8"', unit: 'Quintal', price: 450.00 },
      { legacyCode: 'hie-02', category: 'obra_gris', name: 'Quintal de Hierro Legítimo 1/2"', unit: 'Quintal', price: 780.00 },
      { legacyCode: 'hie-03', category: 'obra_gris', name: 'Quintal de Hierro Legítimo 1/4"', unit: 'Quintal', price: 210.00 },
      { legacyCode: 'blo-01', category: 'obra_gris', name: 'Block de 14x19x39 cm', unit: 'Unidad', price: 4.50 },
      { legacyCode: 'blo-02', category: 'obra_gris', name: 'Block de 19x19x39 cm', unit: 'Unidad', price: 6.00 },
      { legacyCode: 'lad-01', category: 'obra_gris', name: 'Ladrillo Tubular', unit: 'Unidad', price: 2.75 },
      { legacyCode: 'agr-01', category: 'obra_gris', name: 'Arena de Río', unit: 'Metro Cúbico', price: 200.00 },
      { legacyCode: 'agr-02', category: 'obra_gris', name: 'Piedrín', unit: 'Metro Cúbico', price: 225.00 },
      { legacyCode: 'lam-01', category: 'obra_gris', name: 'Lámina Troquelada 12 pies', unit: 'Unidad', price: 130.00 },
      { legacyCode: 'lam-02', category: 'obra_gris', name: 'Lámina Termoacústica 12 pies', unit: 'Unidad', price: 450.00 },
      // PLOMERÍA TUBERÍA
      { legacyCode: 'pvc-01', category: 'plomeria_tuberia', name: 'Tubo PVC 4" para Drenaje', unit: 'Vara (6m)', price: 150.00 },
      { legacyCode: 'pvc-02', category: 'plomeria_tuberia', name: 'Tubo PVC 1/2" para Agua Potable', unit: 'Vara (6m)', price: 45.00 },
      { legacyCode: 'pvc-03', category: 'plomeria_tuberia', name: 'Tubo PVC 3/4" para Agua Potable', unit: 'Vara (6m)', price: 70.00 },
      { legacyCode: 'pvc-04', category: 'plomeria_tuberia', name: 'Codo PVC 1/2" 90° para Agua', unit: 'Unidad', price: 2.50 },
      { legacyCode: 'pvc-05', category: 'plomeria_tuberia', name: 'Codo PVC 3/4" 90° para Agua', unit: 'Unidad', price: 4.00 },
      { legacyCode: 'pvc-06', category: 'plomeria_tuberia', name: 'Te PVC 1/2" para Agua', unit: 'Unidad', price: 3.50 },
      { legacyCode: 'pvc-07', category: 'plomeria_tuberia', name: 'Te PVC 3/4" para Agua', unit: 'Unidad', price: 5.00 },
      { legacyCode: 'pvc-08', category: 'plomeria_tuberia', name: 'Adaptador Macho PVC 1/2"', unit: 'Unidad', price: 3.00 },
      { legacyCode: 'pvc-09', category: 'plomeria_tuberia', name: 'Adaptador Hembra PVC 1/2"', unit: 'Unidad', price: 3.00 },
      { legacyCode: 'pvc-10', category: 'plomeria_tuberia', name: 'Pegamento para PVC (1/4 galón)', unit: 'Unidad', price: 80.00 },
      { legacyCode: 'pvc-11', category: 'plomeria_tuberia', name: 'Limpiador para PVC (1/4 galón)', unit: 'Unidad', price: 65.00 },
      { legacyCode: 'pvc-12', category: 'plomeria_tuberia', name: 'Cinta Teflón', unit: 'Rollo', price: 5.00 },
      // PLOMERÍA ARTEFACTOS
      { legacyCode: 'san-01', category: 'plomeria_artefactos', name: 'Inodoro estándar con tanque', unit: 'Juego', price: 850.00 },
      { legacyCode: 'san-02', category: 'plomeria_artefactos', name: 'Lavamanos de pedestal', unit: 'Juego', price: 450.00 },
      { legacyCode: 'san-03', category: 'plomeria_artefactos', name: 'Ducha completa (regadera y manerales)', unit: 'Juego', price: 375.00 },
      { legacyCode: 'san-04', category: 'plomeria_artefactos', name: 'Grifo de cocina monomando', unit: 'Unidad', price: 500.00 },
      // ELECTRICIDAD CANALIZACIÓN
      { legacyCode: 'ele-01', category: 'electricidad_canalizacion', name: 'Alambre de Amarre', unit: 'Libra', price: 12.00 },
      { legacyCode: 'ele-02', category: 'electricidad_canalizacion', name: 'Caja de Alambre Eléctrico #12 (100m)', unit: 'Caja 100m', price: 450.00 },
      { legacyCode: 'ele-03', category: 'electricidad_canalizacion', name: 'Caja de Alambre Eléctrico #14 (100m)', unit: 'Caja 100m', price: 350.00 },
      { legacyCode: 'ele-04', category: 'electricidad_canalizacion', name: 'Rollo de Poliducto Naranja 1/2" (50m)', unit: 'Rollo 50m', price: 150.00 },
      { legacyCode: 'ele-05', category: 'electricidad_canalizacion', name: 'Caja Rectangular Plástica 4x2"', unit: 'Unidad', price: 3.50 },
      { legacyCode: 'ele-06', category: 'electricidad_canalizacion', name: 'Caja Octogonal Plástica 4x4"', unit: 'Unidad', price: 4.00 },
      { legacyCode: 'ele-12', category: 'electricidad_canalizacion', name: 'Cinta de Aislar', unit: 'Rollo', price: 8.00 },
      // ELECTRICIDAD ACABADOS
      { legacyCode: 'ele-07', category: 'electricidad_acabados', name: 'Tomacorriente Doble con Placa', unit: 'Unidad', price: 25.00 },
      { legacyCode: 'ele-13', category: 'electricidad_acabados', name: 'Tomacorriente 220V para Ducha/Estufa', unit: 'Unidad', price: 60.00 },
      { legacyCode: 'ele-08', category: 'electricidad_acabados', name: 'Interruptor Sencillo con Placa', unit: 'Unidad', price: 20.00 },
      { legacyCode: 'ele-09', category: 'electricidad_acabados', name: 'Plafonera de Baquelita', unit: 'Unidad', price: 10.00 },
      { legacyCode: 'ele-14', category: 'electricidad_acabados', name: 'Lámpara LED de Techo 18W', unit: 'Unidad', price: 120.00 },
      { legacyCode: 'ele-15', category: 'electricidad_acabados', name: 'Bombillo LED 9W', unit: 'Unidad', price: 25.00 },
      { legacyCode: 'ele-10', category: 'electricidad_acabados', name: 'Flipón (Breaker) 15A', unit: 'Unidad', price: 45.00 },
      { legacyCode: 'ele-11', category: 'electricidad_acabados', name: 'Flipón (Breaker) 20A', unit: 'Unidad', price: 45.00 },
      { legacyCode: 'ele-16', category: 'electricidad_acabados', name: 'Centro de Carga para 4 flipones', unit: 'Unidad', price: 150.00 },
      // ACABADOS
      { legacyCode: 'acb-01', category: 'acabados', name: 'Bolsa de Cal', unit: 'Bolsa 25kg', price: 35.00 },
      { legacyCode: 'pin-01', category: 'acabados', name: 'Galón de Pintura de Hule (Blanca)', unit: 'Galón', price: 125.00 },
      { legacyCode: 'pin-02', category: 'acabados', name: 'Cubeta de Pintura de Hule (Blanca)', unit: 'Cubeta 5gl', price: 550.00 },
      // ABERTURAS
      { legacyCode: 'ven-01', category: 'aberturas', name: 'Ventana de aluminio y vidrio 1.00x1.00m', unit: 'Unidad', price: 550.00 },
      { legacyCode: 'ven-02', category: 'aberturas', name: 'Ventana de aluminio y vidrio 1.50x1.20m', unit: 'Unidad', price: 800.00 },
      { legacyCode: 'ven-03', category: 'aberturas', name: 'Ventana de baño (celosía) 0.60x0.40m', unit: 'Unidad', price: 350.00 },
      { legacyCode: 'pue-01', category: 'aberturas', name: 'Puerta interior de MDF con chapa', unit: 'Juego', price: 600.00 },
      { legacyCode: 'pue-02', category: 'aberturas', name: 'Puerta exterior de metal con chapa', unit: 'Juego', price: 1200.00 },
    ];

    for (const m of materialsData) {
      const categoryId = categoryMap.get(m.category);
      if (!categoryId) continue;
      const existing = await this.materialsRepo.findOneBy({ legacyCode: m.legacyCode });
      if (!existing) {
        await this.materialsRepo.save(
          this.materialsRepo.create({
            legacyCode: m.legacyCode,
            categoryId,
            name: m.name,
            unit: m.unit,
            unitPriceGtq: m.price,
            isActive: true,
          }),
        );
      }
    }

    console.log('[MaterialsService] Catálogo sembrado correctamente.');
  }
}
