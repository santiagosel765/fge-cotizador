import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IpMcController } from './ipmc.controller';
import { IpMcService } from './ipmc.service';
import { IpMcItem } from './entities/ipmc-item.entity';
import { IpMcReport } from './entities/ipmc-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IpMcReport, IpMcItem])],
  controllers: [IpMcController],
  providers: [IpMcService],
  exports: [IpMcService],
})
export class IpMcModule {}
