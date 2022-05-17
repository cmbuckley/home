# Needed for issue: CF_Token, CF_Account_ID, CF_Zone_ID
# Needed for deploy: SYNO_Username, SYNO_Password
source ${BASH_SOURCE%/*}/issue.env

acme=/usr/local/share/acme.sh
domain=$1

$acme/acme.sh --debug --issue  --home $acme -d $domain --dns dns_cf
$acme/acme.sh --debug --deploy --home $acme -d $domain --deploy-hook synology_dsm
