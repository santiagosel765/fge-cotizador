import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditRequest } from './entities/credit-request.entity';
import { CreditRequestsController } from './credit-requests.controller';
import { CreditRequestsService } from './credit-requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([CreditRequest])],
  controllers: [CreditRequestsController],
  providers: [CreditRequestsService],
  exports: [CreditRequestsService, TypeOrmModule],
})
export class CreditRequestsModule {}
