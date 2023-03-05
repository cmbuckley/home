#!/bin/bash

# https://datamillnorth.org/dataset/household-waste-collections
url="https://opendata.leeds.gov.uk/downloads/bins/dm_jobs.csv"
output="${0/.sh/.txt}"
tmp="$(mktemp)"

curl -s "$url" |
    grep "$1" |                                            # quick filter to speed up the rest
    awk -F, -v p="$1" -v RS=$'\r\n' '$1~p{print $2, $3}' | # rows matching these premises
    sort -t/ -k3,3 -k2,2 -k1,1 |                           # sort by date
    grep -v $(date +'%d/%m/%y') |                          # ignore collections today
    awk '!_[$1]++' |                                       # unique by collection type
    sed 's~\(..\)/\(..\)/\(..\)~20\3-\2-\1~' > "$tmp"      # d/m/y -> Y-m-d

# atomic replacement of the output file
# avoids unknown vaules while this script runs
mv "$tmp" "$output"
