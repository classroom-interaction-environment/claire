#!/usr/bin/env bash

set -e

# This is the complete test suite kit, that allows to run multiple test
# scenarios during development of the CLAIRE app.
#
# We try to abstract most commends into a few options and defined the following
# behavior:

# defaults:

T_BROWSER="puppeteer"   # uses headless browser for client tests
T_COVERAGE=0            # has coverage disabled
T_FILTER=""             # runs all defined tests
T_RUN_ONCE=""           # runs in watch mode
T_VERBOSE=0             # no extra verbosity
T_SERVER=1              # runs server tests
T_CLIENT=1              # runs client tests
T_PARALLEL=0            # runs tests in parallel
T_LEGACY="--exclude-archs web.browser.legacy,web.cordova"             # exclude legacy archs
# options:

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


while getopts "a:bcg:hlopv" opt; do
  case $opt in
    a)
      if [ "$OPTARG" = "client" ]
      then
        T_CLIENT="1"
        T_SERVER="0"
      elif [ "$OPTARG" = "server" ]
      then
        T_CLIENT="0"
        T_SERVER="1"
      else
        echo "Invalid parameter value for -a: $OPTARG"
        echo "$SCRIPT_USAGE"
        exit 1
      fi
      ;;
    b)
      T_BROWSER=""
      ;;
    g)
      T_FILTER=${OPTARG}
      ;;
    v)
	  T_VERBOSE="1"
      ;;
    c)
      T_COVERAGE="1"
      ;;
    l)
      T_LEGACY="--exclude-archs web.cordova"
      ;;
    o)
      T_RUN_ONCE="--once"
      ;;
    p)
      T_PARALLEL="1"
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

# build paths:

cd ..
CARO_PATH=$(pwd)
cd ${CARO_PATH}/src

T_PACKAGE_DIRS="${CARO_PATH}/lib/api:${CARO_PATH}/lib/ui:${CARO_PATH}/lib/contexts:${CARO_PATH}/lib/dev/:${CARO_PATH}/meteor-mocha/"

PORT=3099

if [ "$T_VERBOSE" -eq "1" ];
then
	echo "=> Test CARO-CORE"
	echo "=> CARO path: [${CARO_PATH}]"
	echo "=> Port: [${PORT}]"
	echo "=> Lib path(s): [${T_PACKAGE_DIRS}]"
	echo "=> Run once? [${T_RUN_ONCE}]"
	echo "=> grep pattern: [${T_FILTER}]"
	echo "=> coverage: [${T_COVERAGE}]"
	echo "=> Browser: [${T_BROWSER}]"
	echo "=> Parallel: [${T_PARALLEL}]"
	echo "=> Arch: [server: ${T_SERVER}, client: ${T_CLIENT}]"
fi

# create command:

METEOR_PACKAGE_DIRS=${T_PACKAGE_DIRS}  \
    TEST_BROWSER_DRIVER=${T_BROWSER} \
    TEST_SERVER=${T_SERVER} \
    TEST_CLIENT=${T_CLIENT} \
    MOCHA_GREP=${T_FILTER} \
    TEST_PARALLEL=${T_PARALLEL} \
    SERVER_TEST_REPORTER="spec" \
    CLIENT_TEST_REPORTER="spec" \
    BABEL_ENV=COVERAGE \
    COVERAGE=${T_COVERAGE} \
    COVERAGE_OUT_HTML=1 \
    COVERAGE_OUT_JSON_SUMMARY=1 \
    COVERAGE_APP_FOLDER=$PWD/ \
    COVERAGE_VERBOSE_MODE=${T_VERBOSE} \
    meteor test \
        ${T_RUN_ONCE} \
        ${T_LEGACY} \
        --driver-package=meteortesting:mocha \
        --settings=tests/settings.json \
        --port=${PORT}
