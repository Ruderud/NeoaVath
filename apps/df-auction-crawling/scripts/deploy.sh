#!/bin/bash
set -e  # 오류 발생 시 즉시 종료

echo "=== 배포 스크립트 시작 ==="
echo "현재 디렉토리: $(pwd)"

# 필요한 도구 설치
echo "=== PM2 설치 확인 ==="
if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 중..."
    sudo npm install -g pm2
fi

# 애플리케이션 디렉토리로 이동
cd /home/ubuntu/app

# 로그 디렉토리 생성 및 권한 설정
echo "=== 로그 디렉토리 설정 ==="
sudo mkdir -p /home/ubuntu/app/.logs
sudo chown -R ubuntu:ubuntu /home/ubuntu/app/.logs
sudo chmod -R 755 /home/ubuntu/app/.logs

# PM2 프로세스 관리
echo "=== PM2 프로세스 관리 시작 ==="
if pm2 list | grep -q "df-auction-crawling"; then
    echo "실행 중인 프로세스를 reload합니다..."
    pm2 reload ecosystem.config.js
else
    echo "새로운 프로세스를 시작합니다..."
    pm2 start ecosystem.config.js
fi

# PM2 프로세스 상태 확인
echo "=== PM2 프로세스 상태 ==="
pm2 list

echo "=== 배포 스크립트 종료 ==="
