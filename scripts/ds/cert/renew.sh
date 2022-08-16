acme=/usr/local/share/acme.sh
domain=$1
password=$2

echo '------------------------------------------------------------------------------'

$acme/acme.sh --upgrade --home $acme
$acme/acme.sh --cron --home $acme

if [ $? -eq 0 ]; then
    $acme/acme.sh --force --toPkcs --home $acme -d $domain --password $password \
        && mv $acme/$domain/$domain.pfx /etc/ssl/private \
        && chmod a+r /etc/ssl/private/$domain.pfx \
        && synopkg restart PlexMediaServer
fi
