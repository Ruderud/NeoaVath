#!/bin/bash
# 애플리케이션 시작
cd /home/ubuntu/app

# 빌드 결과 확인
if [ ! -d "dist" ]; then
    echo "빌드된 파일이 없습니다. 배포를 중단합니다."
    exit 1
fi

# PM2 프로세스가 실행 중인 경우 reload, 아니면 start
if pm2 list | grep -q "online"; then
    echo "실행 중인 PM2 프로세스를 reload합니다..."
    pm2 reload ecosystem.config.js
else
    echo "새로운 PM2 프로세스를 시작합니다..."
    pm2 start ecosystem.config.js
fi

# PM2 프로세스 상태 확인
pm2 list
