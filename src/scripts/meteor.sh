#!/usr/bin/env bash

cd ..
CARO_PATH=$(pwd)
cd ${CARO_PATH}/caro-core

PACKAGE_DIRS="${CARO_PATH}/lib/api:${CARO_PATH}/lib/ui:${CARO_PATH}/lib/contexts:${CARO_PATH}/lib/dev"

METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor "$@"
