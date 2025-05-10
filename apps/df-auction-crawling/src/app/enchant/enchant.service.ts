import { Injectable } from '@nestjs/common';
import { DynamoDBService } from '../dynamodb/dynamodb.service';
import { BatchWriteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AuctionItem, EnchantCategoryKeys } from '@neoavath/neople-api';

type Enchant = {
  /**
   * ENCHANT category pk
   * EnchantCategoryKeys + #EN +  8자리의 숫자로 구정
   * @example 'STATUS#EN00000001'
   */
  pk: `${keyof typeof EnchantCategoryKeys}#EN${string}`;
  sk: string;
  enchantOption: Partial<Record<EnchantCategoryKeys, object[]>>;
};

@Injectable()
export class EnchantService {
  private readonly ENCHANT_TABLE_NAME = 'neoavath-df-enchant-data';
  private _enchantMap: Map<EnchantCategoryKeys, Map<string, Enchant>> | null =
    null;

  constructor(private readonly dynamoDBService: DynamoDBService) {
    this.initEnchantMap();
  }

  public get enchantMap() {
    if (!this._enchantMap) {
      console.warn('enchantMap is not initialized');
    }

    return this._enchantMap;
  }

  public async initEnchantMap() {
    const enchantMap = new Map<
      keyof typeof EnchantCategoryKeys,
      Map<string, Enchant>
    >();

    Object.values(EnchantCategoryKeys).forEach((enchantCategorykey) => {
      const mapkey =
        enchantCategorykey as unknown as keyof typeof EnchantCategoryKeys;
      const emptyEnchant = new Map<Enchant['pk'], Enchant>();
      enchantMap.set(mapkey, emptyEnchant);
    });

    const result = await this.dynamoDBService.getDocClient().send(
      new ScanCommand({
        TableName: this.ENCHANT_TABLE_NAME,
      })
    );

    console.log('enchantMap', enchantMap);

    Array.from(result.Items).forEach((item) => {
      const enchant = item as unknown as Enchant;
      console.log('enchant', enchant);
      const enchantCategory = enchant.pk.split(
        '#'
      )[0] as keyof typeof EnchantCategoryKeys;
      enchantMap.get(enchantCategory)?.set(enchant.sk, enchant);
    });

    return enchantMap;
  }

  public async insertEnchant(
    rawEnchant: AuctionItem['enchant']
  ): Promise<void> {
    if (typeof rawEnchant !== 'object') {
      console.log('rawEnchant is not an object', rawEnchant);
      return;
    }

    const newEnchants = Object.keys(rawEnchant).map((key) => {
      return {
        pk: this.generatePk(key as keyof typeof EnchantCategoryKeys),
        sk: 'TEMP',
        enchantOption: rawEnchant[key],
      };
    });

    const batchWriteParams = {
      RequestItems: {
        [this.ENCHANT_TABLE_NAME]: newEnchants.map((item) => ({
          PutRequest: {
            Item: item,
          },
        })),
      },
    };

    new BatchWriteCommand(batchWriteParams);
  }

  private generatePk(enchantCategory: keyof typeof EnchantCategoryKeys) {
    const enchantMap = this.enchantMap;

    if (!enchantMap) {
      throw new Error('enchantMap is not initialized');
    }

    const enchantCategoryMap = enchantMap.get(
      enchantCategory as EnchantCategoryKeys
    );

    // 현재 해당 카테고리의 enchant 갯수를 확인
    const currentCount = enchantCategoryMap?.size || 0;
    // 다음 번호 생성 (현재 갯수 + 1)
    const nextNumber = (currentCount + 1).toString().padStart(8, '0');

    return `${enchantCategory}#EN${nextNumber}`;
  }
}
