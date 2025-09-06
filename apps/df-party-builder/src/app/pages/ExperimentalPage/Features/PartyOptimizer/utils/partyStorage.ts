// CharacterData는 현재 사용하지 않지만 향후 확장을 위해 import 유지
import { PartyCombination } from './partyGenerator';

/**
 * IndexedDB 스키마 정의
 */
interface PartyCombinationRecord {
  id: string;
  combination: PartyCombination;
  chunkIndex: number;
  totalChunks: number;
  totalCharacters: number;
  createdAt: string;
}

/**
 * IndexedDB 관리 클래스
 */
class PartyStorage {
  private dbName = 'PartyOptimizerDB';
  private version = 1;
  private storeName = 'partyCombinations';
  private db: IDBDatabase | null = null;

  /**
   * IndexedDB 초기화
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('chunkIndex', 'chunkIndex', { unique: false });
          store.createIndex('totalCharacters', 'totalCharacters', { unique: false });
        }
      };
    });
  }

  /**
   * 청크 단위로 조합 저장
   */
  async saveChunk(combinations: PartyCombination[], chunkIndex: number, totalChunks: number, totalCharacters: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const db = this.db;

    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const promises = combinations.map((combination) => {
      const record: PartyCombinationRecord = {
        id: combination.id,
        combination,
        chunkIndex,
        totalChunks,
        totalCharacters,
        createdAt: new Date().toISOString(),
      };
      return store.put(record);
    });

    await Promise.all(promises);
  }

  /**
   * 특정 청크의 조합들 조회
   */
  async getChunk(chunkIndex: number): Promise<PartyCombination[]> {
    if (!this.db) throw new Error('Database not initialized');
    const db = this.db; // null 체크 후 로컬 변수에 할당

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('chunkIndex');
      const request = index.getAll(chunkIndex);

      request.onsuccess = () => {
        const records = request.result as PartyCombinationRecord[];
        const combinations = records.map((record) => record.combination);
        resolve(combinations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 모든 조합 개수 조회
   */
  async getTotalCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const db = this.db;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 특정 캐릭터 수의 모든 조합 삭제
   */
  async clearByCharacterCount(characterCount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const db = this.db;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('totalCharacters');
      const request = index.openCursor(IDBKeyRange.only(characterCount));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 모든 데이터 삭제
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const db = this.db;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 통계 정보 조회
   */
  async getStats(): Promise<{
    totalCombinations: number;
    totalChunks: number;
    characterCount: number | null;
  }> {
    if (!this.db) throw new Error('Database not initialized');
    const db = this.db;

    const totalCombinations = await this.getTotalCount();

    // 첫 번째 레코드에서 메타데이터 조회
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();

      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value as PartyCombinationRecord;
          resolve({
            totalCombinations,
            totalChunks: record.totalChunks,
            characterCount: record.totalCharacters,
          });
        } else {
          resolve({
            totalCombinations: 0,
            totalChunks: 0,
            characterCount: null,
          });
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// 싱글톤 인스턴스
export const partyStorage = new PartyStorage();

/**
 * 조합 생성 진행률 콜백 타입
 */
export type ProgressCallback = (progress: {
  currentChunk: number;
  totalChunks: number;
  combinationsInCurrentChunk: number;
  totalCombinationsSoFar: number;
  isComplete: boolean;
}) => void;
