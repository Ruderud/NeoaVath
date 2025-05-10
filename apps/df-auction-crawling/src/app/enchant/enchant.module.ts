import { Module } from '@nestjs/common';
import { EnchantService } from './enchant.service';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';

@Module({
  imports: [DynamoDBModule],
  controllers: [],
  providers: [EnchantService],
  exports: [EnchantService],
})
export class EnchantModule {}
