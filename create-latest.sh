#!/usr/bin/env bash

image=$1

docker manifest rm "svanosselaer/www-rack-up-qual-is-${image}:latest" 2>/dev/null || true

docker manifest create \
  "svanosselaer/www-rack-up-qual-is-${image}:latest" \
  --amend "svanosselaer/www-rack-up-qual-is-${image}:amd64" \
  --amend "svanosselaer/www-rack-up-qual-is-${image}:arm64" &&
docker manifest push "svanosselaer/www-rack-up-qual-is-${image}:latest"
