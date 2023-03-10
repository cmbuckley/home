#!/bin/bash

tmp="$(mktemp -d)"
gh=https://github.com

# loop over dependencies and their tags
jq -r '.dependencies | to_entries[] | (.key + " " + .value)' "${0%/*}/components.json" | while read dep tag; do

    # find tag name (either vXYZ or XYZ)
    ref=$(git ls-remote --tags $gh/$dep "refs/tags/v$tag" | cut -f2)
    [ -z $ref ] && ref=$(git ls-remote --tags $gh/$dep "refs/tags/$tag" | cut -f2)
    [ -z $ref ] && { echo "Cannot find $dep@$tag" >&2; exit 1; }

    git clone --no-progress -c advice.detachedHead=false $gh/$dep --depth 1 --branch ${ref##*/} "$tmp/${dep#*/}"

    find "$tmp/${dep#*/}/custom_components" -mindepth 1 -maxdepth 1 -type d | while read component; do
        version='none'
        [ -e "${0%/*}/../../ha/custom_components/${component##*/}/manifest.json" ] \
            && version=$(jq -r .version "${0%/*}/../../ha/custom_components/${component##*/}/manifest.json")

        [ "$version" = "$tag" ] \
            && echo "Component $dep already at version $version" \
            || echo "Updating $dep: $version -> $tag"
        rsync -a "$component" "${0%/*}/../../ha/custom_components"
    done
done
