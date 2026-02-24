import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiGeneratedAsset } from './entities/ai-generated-asset.entity';
import { AiMessage } from './entities/ai-message.entity';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiGeneratedAsset, AiConversation, AiMessage])],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: GoogleGenerativeAI,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new GoogleGenerativeAI(configService.get<string>('GEMINI_API_KEY', '')),
    },
  ],
  exports: [AiService, TypeOrmModule],
})
export class AiModule {}
