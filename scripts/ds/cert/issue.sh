export CF_Token="sdfsdfsdfljlbjkljlkjsdfoiwje"
export CF_Account_ID="xxxxxxxxxxxxx"
export CF_Zone_ID="xxxxxxxxxxxxx"
domain=$1

./acme.sh --force --issue --dns dns_cf -d $domain --fullchain-file /usr/syno/etc/certificate/system/FQDN/fullchain.pem --key-file /usr/syno/etc/certificate/system/FQDN/privkey.pem --reloadcmd "synoservice --restart nginx"
