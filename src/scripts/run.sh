#!/usr/bin/env bash

cd ..
CLAIRE_PATH=$(pwd)
cd ${CLAIRE_PATH}/src

PORT=3030
PACKAGE_DIRS="${CLAIRE_PATH}/lib/:${CLAIRE_PATH}/blaze/packages:${CLAIRE_PATH}/plugins/"

set -e

DEBUG_MODE=""
PROD_MODE=""
SCRIPT_USAGE="
Usage: $(basename $0) [OPTIONS]

Options:
  -d              Runs with debug mode
  -p              Runs with --production
"


while getopts "dp" opt; do
  case $opt in
    d)
      DEBUG_MODE="--inspect-brk"
      ;;
    p)
      PROD_MODE="--production"
      ;;
    \?)
      echo "$SCRIPT_USAGE"
      exit 1
      ;;
  esac
done

echo "=> Start CLAIRE"
echo "=> CLAIRE path: [${CLAIRE_PATH}]"
echo "=> Port: [${PORT}]"
echo "=> Lib path(s): [${PACKAGE_DIRS}]"

METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor ${DEBUG_MODE} ${PROD_MODE} --port=$PORT --settings=settings.json
