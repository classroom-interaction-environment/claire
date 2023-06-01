#!/usr/bin/env bash

ARCHIVE=$1
FROM=$2

mongorestore --host="127.0.0.1" --port="3031" \
    --archive="$ARCHIVE" --gzip --verbose \
    --nsInclude="$FROM.*" \
    --nsFrom="$FROM.*" --nsTo="meteor.*" --convertLegacyIndexes
