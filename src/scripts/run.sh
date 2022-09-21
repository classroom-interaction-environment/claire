#!/usr/bin/env bash

cd ..
CLAIRE_PATH=$(pwd)
cd ${CLAIRE_PATH}/src

PORT=3030
PACKAGE_DIRS="${CLAIRE_PATH}/lib/api:${CLAIRE_PATH}/lib/ui:${CLAIRE_PATH}/lib/contexts:${CLAIRE_PATH}/lib/dev:${CLAIRE_PATH}/blaze/packages"

set -e
echo "=> Start CLAIRE"
echo "=> CLAIRE path: [${CLAIRE_PATH}]"
echo "=> Port: [${PORT}]"
echo "=> Lib path(s): [${PACKAGE_DIRS}]"

METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor --port=$PORT --settings=settings.json --exclude-archs web.browser.legacy,web.cordova
