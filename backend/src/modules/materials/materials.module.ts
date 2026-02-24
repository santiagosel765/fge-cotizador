import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialCategory } from './entities/material-category.entity';
import { Material } from './entities/material.entity';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialCategory, Material])],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService, TypeOrmModule],
})
export class MaterialsModule {}
