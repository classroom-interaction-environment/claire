#!/usr/bin/env bash
cd ..
CARO_PATH=$(pwd)
cd ${CARO_PATH}/src

PACKAGE_DIRS="${CARO_PATH}/lib/api:${CARO_PATH}/lib/ui:${CARO_PATH}/lib/contexts:${CARO_PATH}/lib/dev"

set -e
echo "=> Visualize CARO-CORE"
echo "=> CARO path: [${CARO_PATH}]"
echo "=> Lib path(s): [${PACKAGE_DIRS}]"


METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor npm run visualize
