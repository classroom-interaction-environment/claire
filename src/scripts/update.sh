#!/usr/bin/env bash
cd ..
CARO_PATH=$(pwd)
cd ${CARO_PATH}/src

PORT=3030

set -e

# -----------------------------------------------------------------------------
# Step 1: update meteor core and related packages
# -----------------------------------------------------------------------------

# pass all package dirs as parameters to the script call or put them in here
PACKAGE_DIRS="${CARO_PATH}/lib/api:${CARO_PATH}/lib/ui:${CARO_PATH}/lib/contexts:${CARO_PATH}/lib/dev"

echo "=> Update CARO-CORE"
echo "=> CARO path: [${CARO_PATH}]"
echo "=> Port: [${PORT}]"
echo "=> Lib path(s): [${PACKAGE_DIRS}]"


METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor update
METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor update --all-packages

# -----------------------------------------------------------------------------
# Step 2: update all outdated npm packages to the latest
# thanks to: https://stackoverflow.com/a/55406675/3098783
# -----------------------------------------------------------------------------

# meteor npm install $(meteor npm outdated | cut -d' ' -f 1 | sed '1d' | xargs -I '$' echo '$@latest' | xargs echo)

# -----------------------------------------------------------------------------
# Step 3: clean installed modules because some modules are broken
# after an update (mostly related to modules that needs to be built)
# -----------------------------------------------------------------------------
# rm -rf ./node_modules
# meteor npm install
