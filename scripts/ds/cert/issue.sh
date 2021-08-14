# Should export the following vars: CF_Token, CF_Account_ID, CF_Zone_ID
source ${BASH_SOURCE%/*}/issue.env
domain=$1
ssldir=/usr/syno/etc/certificate/system/FQDN

${BASH_SOURCE%/*}/../acme/acme.sh --debug --force --issue --dns dns_cf -d $domain --fullchain-file $ssldir/fullchain.pem --key-file $ssldir/privkey.pem --reloadcmd "synoservice --restart nginx"
