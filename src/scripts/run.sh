#!/usr/bin/env bash

cd ..
CLAIRE_PATH=$(pwd)
cd ${CLAIRE_PATH}/src

PORT=3030
PACKAGE_DIRS="${CLAIRE_PATH}/lib/:${CLAIRE_PATH}/blaze/packages"

set -e

DEBUG_MODE=""
SCRIPT_USAGE="
Usage: $(basename $0) [OPTIONS]

Options:
  -a <String>     Filter architecture, allowed values: 'server' or 'client'
  -b              Use a real browser for client tests (default is headless)
  -c              Activate code-coverage reports
  -g <RegExp>     Filter tests by a given RegExp (uses Mocha-grep)
  -h              Show help
  -l              Include legacy architecture (web.browser.legacy)
  -o              Runs the tests only once (default is watch-mode)
  -p              Runs tests in parallel
  -v              Verbose mode with extra prints
"


while getopts "d" opt; do
  case $opt in
    d)
      DEBUG_MODE="--inspect-brk"
      ;;
    h)
      echo "$SCRIPT_USAGE"
      exit 1
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

METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor ${DEBUG_MODE} --port=$PORT --settings=settings.json
