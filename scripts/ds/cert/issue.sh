# Should export the following vars: CF_Token, CF_Account_ID, CF_Zone_ID
source ${BASH_SOURCE%/*}/issue.env
domain=$1
sslbase=/usr/syno/etc/certificate/_archive
ssldir="$sslbase/$(cat $sslbase/DEFAULT)"

${BASH_SOURCE%/*}/../acme/acme.sh --debug --force --issue --dns dns_cf -d $domain --fullchain-file $ssldir/fullchain.pem --key-file $ssldir/privkey.pem --reloadcmd "synosystemctl reload nginx"
