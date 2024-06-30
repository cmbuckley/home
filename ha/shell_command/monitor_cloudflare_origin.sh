#!/bin/bash
# Usage: ./monitor_cloudflare_origin.sh DOMAIN TOKEN [RECORD_TYPE]

domain="$1"
token="$2"
record_type="$3"

# Install openssl if not there already
command -v openssl >/dev/null || apk add openssl

api=https://api.cloudflare.com/client/v4/zones

# Query Zones API
zones=$(curl -s "$api" -H "Authorization: Bearer $token")

if [[ "$(jq .success <<< "$zones")" == "false" ]]; then
    jq -c .errors <<< "$zones" >&2
    exit 2
fi

# Find zone ID for the zone matching this domain
zone_id=$(jq -r --arg domain "$domain" '.result | map(select(.name | inside($domain)))[0].id' <<< "$zones")

if [ -z "$zone_id" ]; then
    echo "Cannot find zone ID for domain $domain" >&2
    exit 1
fi

# Build origin query
query="name=$domain"
[ -n "$record_type" ] && query="$query&type=$record_type"

# Query Records API
records=$(curl -s "$api/$zone_id/dns_records?$query" -H "Authorization: Bearer $token")

if [[ "$(jq .success <<< "$records")" == "false" ]]; then
    jq -c .errors <<< "$records" >&2
    exit 2
fi

# Find the origin record
origin=$(jq  -r .result[0].content <<< "$records")

if [ -z "$origin" ]; then
    echo "Cannot find origin record for zone $zone_id, $query" >&2
    exit 1
fi

openssl s_client -host $origin -port 443 -servername $domain <<< Q 2>/dev/null |
    openssl x509 -noout -enddate -dateopt iso_8601 |
    sed 's/notAfter=//'
