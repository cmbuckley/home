#!/bin/bash
# Usage: ./update_printer_certificate.sh DOMAIN

domain="$1"

key="/ssl/live/$domain/privkey.pem"
crt="/ssl/live/$domain/fullchain.pem"
pfx="$(mktemp -t printer-pfx-XXXXXX)"
password="$(openssl rand -base64 12)"

# URL for HP EWS printers
upload_url="https://$domain/Security/DeviceCertificates/NewCertWithPassword/Upload"

local_mod="$(openssl x509 -modulus -noout -in "$crt")"
remote_mod="$(openssl s_client -host $domain -port 443 <<< Q 2>/dev/null | openssl x509 -modulus -noout)"

if [ "$local_mod" != "$remote_mod" ]; then
    openssl pkcs12 -export -out "$pfx" -inkey "$key" -in "$crt" -passout "pass:$password"
    curl -Sskv "$upload_url" -F "certificate=@$pfx" -F "password=$password"
    rm "$pfx"
fi
