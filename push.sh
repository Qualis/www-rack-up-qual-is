#!/usr/bin/env bash

image=$1 &&
architecture=$2 &&

if [ -z "$architecture" ]; then
  docker push "svanosselaer/www-rack-up-qual-is-${image}" --all-tags
else
  docker push "svanosselaer/www-rack-up-qual-is-${image}:${architecture}"
fi
