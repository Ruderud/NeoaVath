#!/bin/bash
# PM2가 설치되어 있는지 확인하고, 없으면 설치
if ! command -v pm2 &> /dev/null; then
    echo "PM2가 설치되어 있지 않습니다. 설치를 시작합니다..."
    npm install -g pm2
fi

# pnpm이 설치되어 있는지 확인하고, 없으면 설치
if ! command -v pnpm &> /dev/null; then
    echo "pnpm이 설치되어 있지 않습니다. 설치를 시작합니다..."
    npm install -g pnpm
fi

# PM2 프로세스가 실행 중인 경우에만 reload
if pm2 list | grep -q "online"; then
    echo "실행 중인 PM2 프로세스를 reload합니다..."
    pm2 reload all
else
    echo "실행 중인 PM2 프로세스가 없습니다."
fi
