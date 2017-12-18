#!/bin/bash

set -x

DURATION=${1:-10}
sleep $(( RANDOM % $DURATION +1 ))
echo pospal
