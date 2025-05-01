#!/bin/bash
# 의존성 설치
cd /home/ubuntu/app
pnpm install --no-frozen-lockfile
pnpm nx build:$DEPLOYMENT_GROUP_NAME
