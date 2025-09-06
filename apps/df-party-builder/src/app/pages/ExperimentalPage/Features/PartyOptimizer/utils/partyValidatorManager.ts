/**
 * Party Validator Manager
 * 여러 Web Worker를 관리하여 병렬로 조합을 검증합니다.
 */

import { CharacterData } from '../../../../../types/types';
import { PartyValidationConfig, ValidatedCombination } from './partyValidator';

// Worker 메시지 타입들
type WorkerMessage = {
  type: 'VALIDATE_COMBINATIONS';
  data: {
    combinations: any[];
    characters: CharacterData[];
    config: PartyValidationConfig;
    workerId: number;
  };
};

type WorkerResponse = {
  type: 'COMBINATIONS_VALIDATED' | 'ERROR' | 'PROGRESS';
  data: {
    workerId: number;
    validatedCombinations?: ValidatedCombination[];
    error?: string;
    progress?: number;
    totalValidated?: number;
  };
};

type ProgressCallback = (progress: number, message: string) => void;

export class PartyValidatorManager {
  private workers: Worker[] = [];
  private activeWorkers = 0;
  private totalWorkers = 0;
  private completedWorkers = 0;
  private totalValidated = 0;
  private progressCallback?: ProgressCallback;
  private validatedResults: ValidatedCombination[] = [];

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
        const workerUrl = new URL('../workers/partyValidatorWorker.ts', import.meta.url);

        const worker = new Worker(workerUrl, { type: 'module' });

        worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
          this.handleWorkerMessage(event.data);
        });

        worker.addEventListener('error', (error) => {
          console.error(`!!DEBUG Validator Worker ${i} 오류:`, error);
          this.activeWorkers--;
        });

        this.workers.push(worker);
        console.log(`!!DEBUG Validator Worker ${i} 초기화 완료`);
      } catch (error) {
        console.error(`!!DEBUG Validator Worker ${i} 초기화 실패:`, error);
      }
    }
  }

  /**
   * Worker 메시지를 처리합니다.
   */
  private async handleWorkerMessage(response: WorkerResponse): Promise<void> {
    const { type, data } = response;

    if (type === 'COMBINATIONS_VALIDATED') {
      const { workerId, validatedCombinations, totalValidated } = data;

      if (validatedCombinations && validatedCombinations.length > 0) {
        this.validatedResults.push(...validatedCombinations);
        this.totalValidated += validatedCombinations.length;
      }

      this.activeWorkers--;
      this.completedWorkers++;

      // 진행 상황 업데이트
      if (this.progressCallback) {
        const progress = (this.completedWorkers / this.totalWorkers) * 100;
        this.progressCallback(progress, `Validator Worker ${workerId} 완료 (${totalValidated}개 조합 검증, 총 ${this.totalValidated}개)`);
      }

      console.log(`!!DEBUG Validator Worker ${workerId} 완료: ${totalValidated}개 조합 검증`);
    } else if (type === 'ERROR') {
      const { workerId, error } = data;
      console.error(`!!DEBUG Validator Worker ${workerId} 오류:`, error);
      this.activeWorkers--;
      this.completedWorkers++;
    }
  }

  /**
   * 병렬로 조합을 검증합니다.
   */
  async validateCombinationsInParallel(
    combinations: any[],
    characters: CharacterData[],
    config: PartyValidationConfig,
    batchSize = 100,
    progressCallback?: ProgressCallback,
  ): Promise<ValidatedCombination[]> {
    this.progressCallback = progressCallback;
    this.totalValidated = 0;
    this.completedWorkers = 0;
    this.validatedResults = [];

    console.log(`!!DEBUG 병렬 조합 검증 시작: ${combinations.length}개 조합, ${this.totalWorkers}개 Worker`);

    // 조합을 배치로 나누기
    const batches: any[][] = [];
    for (let i = 0; i < combinations.length; i += batchSize) {
      batches.push(combinations.slice(i, i + batchSize));
    }

    // 각 배치를 Worker에 할당
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const workerIndex = i % this.totalWorkers;
      const worker = this.workers[workerIndex];

      if (worker) {
        const message: WorkerMessage = {
          type: 'VALIDATE_COMBINATIONS',
          data: {
            combinations: batch,
            characters,
            config,
            workerId: workerIndex,
          },
        };

        worker.postMessage(message);
        this.activeWorkers++;

        console.log(`!!DEBUG Validator Worker ${workerIndex}에 배치 할당: ${batch.length}개 조합`);
      }
    }

    // 모든 Worker가 완료될 때까지 대기
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        if (this.completedWorkers >= batches.length) {
          console.log(`!!DEBUG 모든 Validator Worker 완료: 총 ${this.totalValidated}개 조합 검증`);

          // 점수순으로 정렬하여 반환 (테스트용으로 모든 결과 반환)
          const sortedResults = this.validatedResults.sort((a, b) => b.totalScore - a.totalScore);

          resolve(sortedResults);
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
      console.log(`!!DEBUG Validator Worker ${index} 종료`);
    });
    this.workers = [];
    this.activeWorkers = 0;
  }
}
