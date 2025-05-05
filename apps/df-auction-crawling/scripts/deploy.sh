#!/bin/bash
set -e  # 오류 발생 시 즉시 종료


echo "=== 배포 스크립트 시작 ==="
APPLICATION_ROOT="/home/ubuntu/app"
cd $APPLICATION_ROOT

# pnpm 설치
if ! command -v pnpm &> /dev/null; then
    echo "pnpm 설치 중..."
    sudo npm install -g pnpm
fi

# 필요한 도구 설치
echo "=== AWS CLI 설치 확인 ==="
if ! command -v aws &> /dev/null; then
    echo "AWS CLI 설치 중..."
    sudo snap install aws-cli --classic
fi
echo "=== PM2 설치 확인 ==="
if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 중..."
    sudo npm install -g pm2
fi
echo "=== dotenv 설치 확인 ==="
if ! npm list -g | grep dotenv &> /dev/null; then
    echo "dotenv 설치 중..."
    sudo npm install -g dotenv
fi

# 의존성 설치
sudo pnpm install --frozen-lockfile --network-concurrency=4
sudo pnpm build:df-auction-crawling

# 환경변수 주입
get_parameters() {
  local env_prefix="/prod/neoavath/df-auction-crawling"

  # 환경변수 가져오기
  aws ssm get-parameters \
    --names \
      "${env_prefix}/NEOPLE_API_KEY" \
    --with-decryption \
    --query "Parameters[*].[Name,Value]" \
    --output text | while read -r name value; do
      # Parameter Store 경로에서 실제 환경변수 이름 추출
      env_name=$(basename "$name")
      sudo sh -c "echo \"$env_name=$value\" > .env"
    done

  # 파일 권한 및 소유권 설정
  sudo chmod 600 .env
  sudo chown ubuntu:ubuntu .env
}

# 함수 실행
get_parameters

# 환경변수 확인 (선택적)
if [ -f .env ]; then
    echo "환경변수 파일이 생성되었습니다."
else
    echo "환경변수 파일 생성 실패"
    exit 1
fi

# create logs directory
sudo mkdir -p ${APPLICATION_ROOT}/apps/df-auction-crawling/logs
sudo chown -R ubuntu:ubuntu ${APPLICATION_ROOT}/apps/df-auction-crawling/logs
sudo chmod 755 ${APPLICATION_ROOT}/apps/df-auction-crawling/logs

# 애플리케이션 실행
pm2 start ${APPLICATION_ROOT}/apps/df-auction-crawling/ecosystem.config.js --name "df-auction-crawling"

# PM2 프로세스 저장 및 자동 시작 설정
echo "=== PM2 프로세스 저장 ==="
sudo pm2 save

echo "=== 배포 스크립트 종료 ==="
