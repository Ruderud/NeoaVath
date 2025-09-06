/**
 * Web Worker Manager for Party Generation
 * 여러 Web Worker를 관리하여 병렬로 조합을 생성합니다.
 */

import { CharacterData } from '../../../../../types/types';
import { PartyCombination } from './partyGenerator';
import { partyStorage } from './partyStorage';

// Worker 메시지 타입들
type WorkerMessage = {
  type: 'GENERATE_COMBINATIONS';
  data: {
    characters: CharacterData[];
    sizeCombination: number[];
    startId: number;
    maxCombinations: number;
    workerId: number;
  };
};

type WorkerResponse = {
  type: 'COMBINATIONS_GENERATED' | 'ERROR' | 'PROGRESS';
  data: {
    workerId: number;
    combinations?: PartyCombination[];
    error?: string;
    progress?: number;
    totalGenerated?: number;
  };
};

type ProgressCallback = (progress: number, message: string) => void;

export class PartyWorkerManager {
  private workers: Worker[] = [];
  private activeWorkers = 0;
  private totalWorkers = 0;
  private completedWorkers = 0;
  private totalCombinations = 0;
  private progressCallback?: ProgressCallback;
  private chunkIndex = 0;
  private chunkSize = 1000;

  constructor(maxWorkers = 4) {
    this.totalWorkers = Math.min(maxWorkers, navigator.hardwareConcurrency || 4);
    this.initializeWorkers();
  }

  /**
   * Web Worker들을 초기화합니다.
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.totalWorkers; i++) {
      try {
        // Worker 파일 경로 (Vite 환경에서 처리)
        const workerUrl = new URL('../workers/partyGeneratorWorker.ts', import.meta.url);

        const worker = new Worker(workerUrl, { type: 'module' });

        worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
          this.handleWorkerMessage(event.data);
        });

        worker.addEventListener('error', (error) => {
          console.error(`!!DEBUG Worker ${i} 오류:`, error);
          this.activeWorkers--;
        });

        this.workers.push(worker);
        console.log(`!!DEBUG Worker ${i} 초기화 완료`);
      } catch (error) {
        console.error(`!!DEBUG Worker ${i} 초기화 실패:`, error);
      }
    }
  }

  /**
   * Worker 메시지를 처리합니다.
   */
  private async handleWorkerMessage(response: WorkerResponse): Promise<void> {
    const { type, data } = response;

    if (type === 'COMBINATIONS_GENERATED') {
      const { workerId, combinations, totalGenerated } = data;

      if (combinations && combinations.length > 0) {
        // IndexedDB에 저장
        await this.saveCombinationsToIndexedDB(combinations);
        this.totalCombinations += combinations.length;
      }

      this.activeWorkers--;
      this.completedWorkers++;

      // 진행 상황 업데이트
      if (this.progressCallback) {
        const progress = (this.completedWorkers / this.totalWorkers) * 100;
        this.progressCallback(progress, `Worker ${workerId} 완료 (${totalGenerated}개 조합 생성, 총 ${this.totalCombinations}개)`);
      }

      console.log(`!!DEBUG Worker ${workerId} 완료: ${totalGenerated}개 조합 생성`);
    } else if (type === 'ERROR') {
      const { workerId, error } = data;
      console.error(`!!DEBUG Worker ${workerId} 오류:`, error);
      this.activeWorkers--;
      this.completedWorkers++;
    }
  }

  /**
   * 조합들을 IndexedDB에 저장합니다.
   */
  private async saveCombinationsToIndexedDB(combinations: PartyCombination[]): Promise<void> {
    try {
      // 청크 단위로 저장
      for (let i = 0; i < combinations.length; i += this.chunkSize) {
        const chunk = combinations.slice(i, i + this.chunkSize);
        const currentChunkIndex = this.chunkIndex++;

        await partyStorage.saveChunk(chunk, currentChunkIndex, 0, combinations[0]?.totalCharacters || 0);
      }
    } catch (error) {
      console.error('!!DEBUG IndexedDB 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 병렬로 조합을 생성합니다.
   */
  async generateCombinationsInParallel(
    characters: CharacterData[],
    sizeCombinations: number[][],
    maxCombinationsPerWorker = 50000,
    progressCallback?: ProgressCallback,
  ): Promise<number> {
    this.progressCallback = progressCallback;
    this.totalCombinations = 0;
    this.completedWorkers = 0;
    this.chunkIndex = 0;

    // IndexedDB 초기화
    await partyStorage.init();
    await partyStorage.clearByCharacterCount(characters.length);

    console.log(`!!DEBUG 병렬 조합 생성 시작: ${sizeCombinations.length}개 크기 조합, ${this.totalWorkers}개 Worker`);

    // 각 크기 조합을 Worker에 할당
    const tasks: Array<{ sizeCombination: number[]; startId: number }> = [];
    let currentStartId = 1;

    for (const sizeCombination of sizeCombinations) {
      tasks.push({
        sizeCombination,
        startId: currentStartId,
      });
      // 다음 조합의 시작 ID는 현재 조합의 예상 개수만큼 증가
      // (정확한 계산은 복잡하므로 대략적으로 계산)
      currentStartId += maxCombinationsPerWorker;
    }

    // Worker에 작업 할당
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const workerIndex = i % this.totalWorkers;
      const worker = this.workers[workerIndex];

      if (worker) {
        const message: WorkerMessage = {
          type: 'GENERATE_COMBINATIONS',
          data: {
            characters,
            sizeCombination: task.sizeCombination,
            startId: task.startId,
            maxCombinations: maxCombinationsPerWorker,
            workerId: workerIndex,
          },
        };

        worker.postMessage(message);
        this.activeWorkers++;

        console.log(`!!DEBUG Worker ${workerIndex}에 작업 할당: [${task.sizeCombination.join(', ')}]`);
      }
    }

    // 모든 Worker가 완료될 때까지 대기
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        if (this.completedWorkers >= tasks.length) {
          console.log(`!!DEBUG 모든 Worker 완료: 총 ${this.totalCombinations}개 조합 생성`);
          resolve(this.totalCombinations);
        } else {
          setTimeout(checkCompletion, 100);
        }
      };

      checkCompletion();
    });
  }

  /**
   * 모든 Worker를 종료합니다.
   */
  terminate(): void {
    this.workers.forEach((worker, index) => {
      worker.terminate();
      console.log(`!!DEBUG Worker ${index} 종료`);
    });
    this.workers = [];
    this.activeWorkers = 0;
  }
}
