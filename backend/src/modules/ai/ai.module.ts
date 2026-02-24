import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialsModule } from '../materials/materials.module';
import { ProjectsModule } from '../projects/projects.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiGeneratedAsset } from './entities/ai-generated-asset.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiGeneratedAsset, AiConversation]),
    ProjectsModule,
    MaterialsModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
