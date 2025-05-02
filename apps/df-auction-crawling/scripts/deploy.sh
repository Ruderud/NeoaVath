#!/bin/bash
set -e  # 오류 발생 시 즉시 종료

echo "=== 배포 스크립트 시작 ==="
echo "현재 디렉토리: $(pwd)"
echo "환경 변수:"
env | grep -E "NODE|PM2|PATH"

# 필요한 도구 설치
echo "=== PM2 설치 확인 ==="
if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 중..."
    sudo npm install -g pm2
fi

# 애플리케이션 디렉토리로 이동
cd /home/ubuntu/app
echo "=== 현재 디렉토리 내용 ==="
ls -la

# 로그 디렉토리 생성
echo "=== 로그 디렉토리 설정 ==="
mkdir -p logs
ls -la logs

# PM2 프로세스 관리
echo "=== PM2 프로세스 관리 시작 ==="
echo "=== PM2 버전 확인 ==="
pm2 --version

echo "=== PM2 현재 프로세스 목록 ==="
pm2 list

echo "=== ecosystem.config.js 내용 확인 ==="
cat ecosystem.config.js

if pm2 list | grep -q "df-auction-crawling"; then
    echo "실행 중인 프로세스를 reload합니다..."
    pm2 reload ecosystem.config.js || {
        echo "PM2 reload 실패. 자세한 로그:"
        pm2 logs df-auction-crawling --lines 100
        echo "=== PM2 프로세스 상태 ==="
        pm2 list
        exit 1
    }
else
    echo "새로운 프로세스를 시작합니다..."
    pm2 start ecosystem.config.js || {
        echo "PM2 start 실패. 자세한 로그:"
        pm2 logs df-auction-crawling --lines 100
        echo "=== PM2 프로세스 상태 ==="
        pm2 list
        exit 1
    }
fi

# PM2 프로세스 상태 확인
echo "=== PM2 프로세스 상태 ==="
pm2 list

# PM2 로그 확인
echo "=== PM2 로그 확인 ==="
pm2 logs df-auction-crawling --lines 50

# PM2 프로세스 저장 및 자동 시작 설정
echo "=== PM2 프로세스 저장 ==="
pm2 save

echo "=== 배포 스크립트 종료 ==="
