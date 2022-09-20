#!/usr/bin/env bash
cd ..
CARO_PATH=$(pwd)
cd ${CARO_PATH}/src

PACKAGE_DIRS="${CARO_PATH}/lib/api:${CARO_PATH}/lib/ui:${CARO_PATH}/lib/contexts"


METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor list --tree --weak >> "${CARO_PATH}/caro-core/.packages_tree"
cat "${CARO_PATH}/caro-core/.packages_tree"
