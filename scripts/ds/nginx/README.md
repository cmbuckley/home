# nginx Reverse Proxies

These could be handled using [Synology reverse proxies](https://kb.synology.com/en-ca/DSM/help/DSM/AdminCenter/system_login_portal_advanced?version=7), but these manual versions use path-based routing instead of host-based.

These should be symlinked into `/etc/nginx/conf.d` and then restart nginx as follows:

```bash
sudo synosystemctl restart nginx
```

## Bazarr

This expects **Settings > General > URL Base** to be set to `/bazarr`.

## Prowlarr

This expects **Settings > General > URL Base** to be set to `/prowlarr`.

## Radarr

This expects **Settings > General > URL Base** to be set to `/radarr`.

## Sonarr

This expects **Settings > General > URL Base** to be set to `/sonarr`.
