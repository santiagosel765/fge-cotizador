import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { QuotationItem } from './entities/quotation-item.entity';
import { Quotation } from './entities/quotation.entity';
import { LaborConfigController } from './labor-config.controller';
import { LaborConfig } from './entities/labor-config.entity';
import { LaborConfigService } from './labor-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quotation, QuotationItem, LaborConfig])],
  controllers: [QuotationsController, LaborConfigController],
  providers: [QuotationsService, LaborConfigService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
