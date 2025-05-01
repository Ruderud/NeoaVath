#!/bin/bash
set -e  # 오류 발생 시 즉시 종료

echo "=== 배포 스크립트 시작 ==="
echo "현재 디렉토리: $(pwd)"

# Node.js 및 npm 경로 설정
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# 필요한 도구 설치
echo "=== 필요한 도구 설치 시작 ==="
if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 중..."
    sudo npm install -g pm2
fi

if ! command -v pnpm &> /dev/null; then
    echo "pnpm 설치 중..."
    sudo npm install -g pnpm
fi
echo "=== 필요한 도구 설치 완료 ==="

# 애플리케이션 디렉토리로 이동
cd /home/ubuntu/app

# pnpm 설정
echo "=== pnpm 설정 시작 ==="
pnpm config set store-dir /home/ubuntu/.pnpm-store
pnpm config set node-linker hoisted
pnpm config set network-concurrency 1
pnpm config set child-concurrency 1
echo "=== pnpm 설정 완료 ==="

# 의존성 설치
echo "=== 의존성 설치 시작 ==="
NODE_OPTIONS="--max-old-space-size=256" pnpm install --no-frozen-lockfile --network-timeout 100000 --prefer-offline
echo "=== 의존성 설치 완료 ==="

# 빌드
echo "=== 빌드 시작 ==="
NODE_OPTIONS="--max-old-space-size=256" pnpm build:df-auction-crawling
echo "=== 빌드 완료 ==="

# 빌드 결과 확인
if [ ! -d "dist" ]; then
    echo "빌드된 파일이 없습니다. 배포를 중단합니다."
    exit 1
fi

# PM2 프로세스 관리
echo "=== PM2 프로세스 관리 시작 ==="
if pm2 list | grep -q "online"; then
    echo "실행 중인 PM2 프로세스를 reload합니다..."
    pm2 reload ecosystem.config.js
else
    echo "새로운 PM2 프로세스를 시작합니다..."
    pm2 start ecosystem.config.js
fi

# PM2 프로세스 상태 확인
echo "=== PM2 프로세스 상태 ==="
pm2 list

echo "=== 배포 스크립트 종료 ==="
