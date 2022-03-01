#!/bin/bash
# Usage: ./update_printer_certificate.sh DOMAIN

domain="$1"

key="/ssl/live/$domain/privkey.pem"
crt="/ssl/live/$domain/fullchain.pem"
pfx="$(mktemp -t printer-XXXX.pfx)"
password="$(openssl rand -base64 12)"

# URL for HP EWS printers
upload_url="https://$domain/Security/DeviceCertificates/NewCertWithPassword/Upload"

openssl pkcs12 -export -out "$pfx" -inkey "$key" -in "$crt" -passout "pass:$password"
curl -Sskv "$upload_url" -F "certificate=@$pfx" -F "password=$password"
