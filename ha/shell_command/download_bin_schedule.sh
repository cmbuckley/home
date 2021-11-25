#!/bin/bash

# https://datamillnorth.org/dataset/household-waste-collections
url="https://opendata.leeds.gov.uk/downloads/bins/dm_jobs.csv"
output="${0/.sh/.txt}"

curl -s "$url" \
    | awk -F, -v premise="$1" -v RS=$'\r\n' '$1~premise{print $2, $3}' \
    | sort -t/ -k3,3 -k2,2 -k1,1 \
    | sort -u -k1,1 \
    | sed 's~\(..\)/\(..\)/\(..\)~20\3-\2-\1~' > "$output"
