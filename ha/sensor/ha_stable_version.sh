#!/bin/bash

version=$1
registry=https://registry.hub.docker.com/v2/repositories/homeassistant/$version-homeassistant/tags
digest=$(curl -s "$registry/stable" | jq -r '.images[0].digest')

value=
next=$registry

while [ -z "$value" -a -n "$next" ]; do
    response=$(curl -s "$next")
    next=$(jq -r '.next' <<< "$response")
    value=$(jq -r '.results | .[] | select(.images | map(select(.digest == "'$digest'")) | length > 0) | select(.name != "stable" and .name != "latest")' <<< "$response")
done

jq -cM --arg d "$digest" 'del(.images) | .digest = $d' <<< "$value"
