import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DynamoDBModule } from './dynamodb/dynamodb.module';
import { EnchantModule } from './enchant/enchant.module';

@Module({
  imports: [ScheduleModule.forRoot(), DynamoDBModule, EnchantModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
