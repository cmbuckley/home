domain=$1
password=$2

echo '------------------------------------------------------------------------------'

${BASH_SOURCE%/*}/../acme/acme.sh --renew -d $domain

if [ $? -eq 0 ]; then
    ${BASH_SOURCE%/*}/../acme/acme.sh --force --toPkcs -d $domain --password $password \
        && mv /root/.acme.sh/$domain/$domain.pfx /etc/ssl/private \
        && synoservicecfg --restart "pkgctl-Plex Media Server"
fi
