#!/bin/bash
# 의존성 설치 및 빌드
cd /home/ubuntu/app
pnpm install --no-frozen-lockfile
pnpm build:df-auction-crawling

# 빌드 성공 여부 확인
if [ $? -eq 0 ]; then
    echo "빌드가 성공적으로 완료되었습니다."
else
    echo "빌드 중 오류가 발생했습니다."
    exit 1
fi
