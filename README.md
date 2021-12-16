# Home Assistant

Scripts for smart home. Almost everything is managed via Home Assistant in [ha](ha) directory, with some other legacy/ancilliary scripts elsewhere.

## To Do

Script the following:

* Update (below)
  * Should do regular updates, ideally with a canary image and testing the config against the new version
* Nightly backups of DB

## Other Things

* [Grafana](https://community.home-assistant.io/t/complete-guide-on-setting-up-grafana-influxdb-with-home-assistant-using-official-docker-images/42860)

## Updating

```bash
docker stop homeassistant
docker rm homeassistant
cp -r ha ha-bak
docker commit -p $(docker ps -f name=homeassistant -q) homeassistant-backup
docker save homeassistant-backup | gzip > homeassistant.tar.gz
docker pull homeassistant/raspberrypi4-homeassistant:stable
docker run --init -d --name homeassistant --restart=unless-stopped --device=/dev/gpiomem -v /etc/localtime:/etc/localtime:ro -v ~/git/home/ha:/config --network=host homeassistant/raspberrypi4-homeassistant:stable
docker system prune -a
```
