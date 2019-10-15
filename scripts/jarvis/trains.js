require('dotenv').config();

const fs = require('fs');
const util = require('util');
const csv = require('neat-csv');
const Rail = require('national-rail-darwin-promise');
const SlackEmitter = require('./slack');

const rail = new Rail(process.env.RAIL_TOKEN);
const slack = new SlackEmitter();

slack.on('ready', async () => {
    const file = await util.promisify(fs.readFile)('config/station_codes.csv', 'utf8');
    const stations = await csv(file, {
        mapHeaders: h => ['station', 'code'][h.index]
    });

    function getCode(lookup) {
        lookup = lookup.toLowerCase();
        return stations.find(s => (s.code.toLowerCase() == lookup || s.station.toLowerCase() == lookup));
    }

    try {
        let from = getCode('LDS'),
            to = getCode('HFX'),
            limit = 3;

        let departures = await rail.getDepartureBoard(from.code, {destination: to.code});
        let fields = departures.trainServices.slice(0, limit).reduce(function (fields, dep) {
            let marker = (dep.etd == 'On time' ? '' : ':warning: ');
            fields.push({
                type: 'mrkdwn',
                text: '*' + dep.std + '* ' + dep.destination.name,
            }, {
                type: 'plain_text',
                text: marker + (dep.platform ? 'Plat ' + dep.platform + ', ' : '') + dep.etd,
            });

            return fields;
        }, []);
    } catch (err) {
        console.log(err);
    }

    let text = util.format('The next %d departures from %s to %s are:', limit, from.station, to.station);
    slack.emit('message', 'jarvis-test', {
        text: text,
        blocks: [{
            type: 'section',
            text: {
                type: 'plain_text',
                text: ':train2: ' + text,
            },
            fields: fields
        }],
    });
});
