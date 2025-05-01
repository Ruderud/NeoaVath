#!/bin/bash
set -e  # 오류 발생 시 즉시 종료

echo "=== AfterInstall 스크립트 시작 ==="
echo "현재 디렉토리: $(pwd)"

# 의존성 설치 및 빌드
cd /home/ubuntu/app

echo "=== 의존성 설치 시작 ==="
pnpm install --no-frozen-lockfile
echo "=== 의존성 설치 완료 ==="

echo "=== 빌드 시작 ==="
pnpm build:df-auction-crawling
echo "=== 빌드 완료 ==="

# 빌드 결과 확인
if [ $? -eq 0 ]; then
    echo "빌드가 성공적으로 완료되었습니다."
    echo "빌드 결과:"
    ls -la dist/
else
    echo "빌드 중 오류가 발생했습니다."
    exit 1
fi

echo "=== AfterInstall 스크립트 종료 ==="
