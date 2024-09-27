#!/bin/bash
# Usage: ./update_printer_certificate.sh DOMAIN

domain="$1"

# Install openssl if not there already
command -v openssl >/dev/null || apk add openssl

key="/ssl/live/$domain/privkey.pem"
crt="/ssl/live/$domain/fullchain.pem"
pfx="$(mktemp -t printer-pfx-XXXXXX)"
password="$(openssl rand -base64 12)"
ip=$(dig +short $domain | tail -1)

# URL for HP EWS printers
upload_url="https://$ip/Security/DeviceCertificates/NewCertWithPassword/Upload"

local_mod="$(openssl x509 -modulus -noout -in "$crt")"
remote_mod="$(openssl s_client -host $domain -port 443 <<< Q 2>/dev/null | openssl x509 -modulus -noout)"

if [ "$local_mod" == "$remote_mod" ]; then
    echo "Server certificate matches local certificate"
else
    echo "Server certificate needs to be updated"
    openssl pkcs12 -export -out "$pfx" -inkey "$key" -in "$crt" -passout "pass:$password"
    curl -Sskv "$upload_url" -F "certificate=@$pfx" -F "password=$password"
    rm "$pfx"
fi
