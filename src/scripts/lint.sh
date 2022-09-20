#!/usr/bin/env bash

set -e

meteor npm run lint:code
meteor npm run lint:style
meteor npm run lint:markdown
