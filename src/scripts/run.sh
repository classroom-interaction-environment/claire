#!/usr/bin/env bash
cd ..
CARO_PATH=$(pwd)
cd ${CARO_PATH}/src

PORT=3030
PACKAGE_DIRS="${CARO_PATH}/lib/api:${CARO_PATH}/lib/ui:${CARO_PATH}/lib/contexts:${CARO_PATH}/lib/dev:${CARO_PATH}/blaze/packages"

set -e
echo "=> Start CARO-CORE"
echo "=> CARO path: [${CARO_PATH}]"
echo "=> Port: [${PORT}]"
echo "=> Lib path(s): [${PACKAGE_DIRS}]"


METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor npm install
METEOR_DYNAMIC_PACKAGES=1 AUTOFORM_DYNAMIC_IMPORT=1 METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor --port=$PORT --settings=settings.json --exclude-archs web.browser.legacy,web.cordova
