while read mac sub; do show ipv6 neighbors | grep $mac | grep -v fe80 | awk -v s=$sub '{print $1, s}'; done
