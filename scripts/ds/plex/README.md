# Plex over HTTPS

Created a PFX certificate as part of the cert renewal:

```
acme.sh --force --toPkcs -d DOMAIN --password ENC_KEY
mv /path/to/DOMAIN/DOMAIN.pfx /etc/ssl/private
```

Then set up Plex with the PFX and password.

When setting HTTPS to enforced, rather than HTTP redirecting, it simply refuses the connection.

So need to update the desktop icon:

```
sed -i 's/http/https/' /usr/syno/synoman/webman/3rdparty/plex/config
```

Need to restart nginx afterwards:

```
sudo synoservice --restart nginx
```
