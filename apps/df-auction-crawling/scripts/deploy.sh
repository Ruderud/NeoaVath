#!/bin/bash
set -e  # 오류 발생 시 즉시 종료

echo "=== 배포 스크립트 시작 ==="
echo "현재 디렉토리: $(pwd)"

# pnpm 설치
if ! command -v pnpm &> /dev/null; then
    echo "pnpm 설치 중..."
    sudo npm install -g pnpm
fi

# 필요한 도구 설치
echo "=== PM2 설치 확인 ==="
if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 중..."
    sudo pnpm install -g pm2
fi

# 애플리케이션 디렉토리로 이동
cd /home/ubuntu/deployment

# 의존성 설치
pnpm install --frozen-lockfile

# 애플리케이션 실행
pm2 start ecosystem.config.js --name "df-auction-crawling"

# PM2 프로세스 저장 및 자동 시작 설정
echo "=== PM2 프로세스 저장 ==="
sudo pm2 save

echo "=== 배포 스크립트 종료 ==="
