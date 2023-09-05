#!/bin/bash

# https://datamillnorth.org/dataset/household-waste-collections
url="https://opendata.leeds.gov.uk/downloads/bins/dm_jobs.csv"
output="${0/.sh/.txt}"
tmp="$(mktemp)"
today="$(date +'%Y-%m-%d')"

curl -s "$url" |
    grep "$1" |                                            # quick filter to speed up the rest
    awk -F, -v p="$1" -v RS=$'\r\n' '$1~p{print $2, $3}' | # rows matching these premises
    sed 's~\(..\)/\(..\)/\(..\)~20\3-\2-\1~' |             # d/m/y -> Y-m-d
    sort -k2 |                                             # sort by date
    awk -v d=$today '$2>d&&!_[$1]++' > "$tmp"              # unique by colour, removing entries before today

# atomic replacement of the output file
# avoids unknown vaules while this script runs
mv "$tmp" "$output"
