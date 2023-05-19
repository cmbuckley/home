acme=/usr/local/share/acme.sh
domain=$1
password=$2

echo '------------------------------------------------------------------------------'

$acme/acme.sh --upgrade --home $acme
$acme/acme.sh --cron --home $acme

if [ $? -eq 0 ]; then
    openssl pkcs12 -export -out /etc/ssl/private/$domain.pfx \
        -certpbe AES-256-CBC -keypbe AES-256-CBC -macalg SHA256 \
        -inkey $acme/$domain/$domain.key \
        -in $acme/$domain/$domain.cer \
        -certfile $acme/$domain/ca.cer \
        -password pass:$password \
        && chmod a+r /etc/ssl/private/$domain.pfx \
        && synopkg restart PlexMediaServer
fi
