#!/usr/bin/env bash

cd ..
LIB_PATH="../lib"
CARO_PATH=$(pwd)
cd "$CARO_PATH/src" || exit 1

PACKAGE_DIRS="$LIB_PATH:${CARO_PATH}/lib/api:${CARO_PATH}/lib/ui:${CARO_PATH}/lib/contexts:${CARO_PATH}/lib/dev"

METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor "$@"
