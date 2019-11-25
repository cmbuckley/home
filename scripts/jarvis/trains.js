const fs = require('fs');
const util = require('util');
const csv = require('neat-csv');
const moment = require('moment-timezone');
const Rail = require('national-rail-darwin-promise');

module.exports = async function (slack, options) {
    const rail = new Rail(options.railToken);

    // load station details
    const file = await util.promisify(fs.readFile)('config/station_codes.csv', 'utf8');
    const stations = await csv(file, {
        mapHeaders: h => ['station', 'code'][h.index]
    });

    function getCode(lookup) {
        lookup = lookup.toLowerCase();
        return stations.find(s => (s.code.toLowerCase() == lookup || s.station.toLowerCase() == lookup));
    }

    slack.on('slash:trains', async function(args, reply) {
        let from = (args.length == 2 ? args[0] : options.defaultFrom),
            to = (args.length == 2 ? args[1] : options.defaultTo),
            limit = 3,
            fields = [];

        // check valid args
        if (args.length != 0 && args.length != 2) {
            return reply({
                response_type: 'ephemeral',
                text: 'You should type `/trains FROM TO` to get a departure board.',
            });
        }

        // default train stations switches direction in the afternoon
        if (args.length == 0 && moment().tz('Europe/London').format('a') == 'pm') {
            [from, to] = [to, from];
        }

        from = getCode(from);
        if (!from) {
            return reply({
                response_type: 'ephemeral',
                text: 'I could not recognise `' + args[0] + '`',
            });
        }

        to = getCode(to);
        if (!to) {
            return reply({
                response_type: 'ephemeral',
                text: 'I could not recognise `' + args[1] + '`',
            });
        }

        // build departure list
        try {
            let departures = await rail.getDepartureBoard(from.code, {destination: to.code});
            fields = departures.trainServices.slice(0, limit).reduce(function (fields, dep) {
                let markers = {'On time': '', 'Cancelled': ':no_entry_sign: '},
                    marker = (markers.hasOwnProperty(dep.etd) ? markers[dep.etd] : ':warning: ');

                fields.push({
                    type: 'mrkdwn',
                    text: '*' + dep.std + '* ' + dep.destination.name,
                }, {
                    type: 'mrkdwn',
                    text: marker + (dep.platform ? 'Plat ' + dep.platform + ', ' : '')
                        + (['Cancelled', 'On time'].includes(dep.etd) ? dep.etd : 'Exp *' + dep.etd + '*'),
                });

                return fields;
            }, []);
        } catch (err) {
            slack.log.error(err);
            return reply({
                response_type: 'ephemeral',
                text: 'Sorry! There was an error: ' + err.message,
            })
        }

        // if there are no trains
        if (!fields.length) {
            return reply({
                response_type: 'in_channel',
                text: util.format('Sorry, there are no upcoming trains from %s to %s!', from.station, to.station),
            });
        }

        // reply to user
        let text = util.format('The next %d departures from *%s* to *%s* are:', fields.length / 2, from.station, to.station);
        reply({
            response_type: 'in_channel',
            text: text,
            blocks: [{
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: ':train2: ' + text,
                },
                fields: fields
            }, {
                type: 'context',
                elements: [{
                    type: 'mrkdwn',
                    text: '*<http://ojp.nationalrail.co.uk/service/ldbboard/dep/' + from.code + '/' + to.code + '/To|Show more times>*',
                }]
            }],
        });
    });
};
