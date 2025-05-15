import { Module } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';

@Module({
  imports: [],
  controllers: [],
  providers: [DynamoDBService],
  exports: [DynamoDBService],
})
export class DynamoDBModule {}
