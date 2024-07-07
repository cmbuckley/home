#!/bin/bash

# https://datamillnorth.org/dataset/household-waste-collections
url="https://opendata.leeds.gov.uk/downloads/bins/dm_jobs.csv"
output="${0/.sh/.txt}"
tmp="$(mktemp)"
today="$(date +'%Y-%m-%d')"

if [ -z "$1" ]; then
    echo "Must provide council premises" >&2
    exit 1
fi

response=$(curl -s -o "$tmp" -w "%{response_code}" "$url")

if [ $response != "200" ]; then
    echo "Got HTTP $response from bins endpoint" >&2
    exit 1
fi

if [ ! -s "$tmp" ]; then
    echo "Got no data from bins endpoint" >&2
    exit 1
fi

grep "$1" "$tmp" |                                         # quick filter to speed up the rest
    awk -F, -v p="$1" -v RS=$'\r\n' '$1~p{print $2, $3}' | # rows matching these premises
    sed 's~\(..\)/\(..\)/\(..\)~20\3-\2-\1~' |             # d/m/y -> Y-m-d
    sort -k2 |                                             # sort by date
    awk -v d=$today '$2>d&&!_[$1]++' > "$tmp.filtered"     # unique by colour, removing entries before today

# atomic replacement of the output file
# avoids unknown vaules while this script runs
mv "$tmp.filtered" "$output"
