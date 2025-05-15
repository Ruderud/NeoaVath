import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamoDBService {
  private docClient: DynamoDBDocumentClient | null = null;

  public getDocClient() {
    return this.docClient;
  }

  constructor() {
    this.dynamoDbInit();
  }

  private async dynamoDbInit() {
    const client = new DynamoDBClient({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.NEOAVATH_DEVELOPER_AWS_ACCESS_KEY,
        secretAccessKey: process.env.NEOAVATH_DEVELOPER_AWS_SECRET_ACCESS_KEY,
      },
    });

    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        // 빈 문자열 제거
        removeUndefinedValues: true,
        // 숫자를 문자열로 변환하지 않음
        convertClassInstanceToMap: true,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });
  }
}
