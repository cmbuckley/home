// copy working locations and Holiday events to a separate calendar
function syncLocations() {
  const targetName = 'Working Locations';
  const targetId = Calendar.CalendarList.list({showHidden: true}).items.find(c => c.summary == targetName).id;

  const start = new Date();
  start.setDate(start.getDate() - 7);

  // delete existing before syncing
  console.log('Deleting existing events');
  cleanup(targetId, start);

  const events = Calendar.Events.list('primary', {
    timeMin: start.toISOString(),
    eventTypes: ['default', 'workingLocation', 'outOfOffice'],
  });

  const locationMap = {
    homeOffice:     'Home',
    officeLocation: 'Office',
  };

  events.items.forEach(event => {
    let dates = {start: event.start, end: event.end},
      summary;

    switch (event.eventType) {
      case 'workingLocation':
        // home or office looks like {type: 'homeOffice', homeOffice: {}}
        // custom looks like {type: 'customLocation', customLocation: {label: 'Foo'}}
        const props = event.workingLocationProperties;
        summary = props[props.type].label || locationMap[props.type];
        console.log('Working location for ' + dates.start.date + ' is ' + summary);
        break;

      case 'outOfOffice':
        // outOfOffice events don't support normal all-day
        if (event.start.dateTime.includes('T00:00:00')) {
          dates.start.date = dates.start.dateTime.substring(0, 10);
          dates.end.date = dates.end.dateTime.substring(0, 10);
          delete dates.start.dateTime;
          delete dates.end.dateTime;

          summary = 'Holiday';
          console.log('Out of office on ' + dates.start.date);
        }
        break;

      default:
        if (event.summary == 'Holiday') {
          summary = 'Holiday';
          console.log('Holiday on ' + dates.start.date);
        }
    }

    if (summary) {
      Calendar.Events.insert({
        start:   dates.start,
        end:     dates.end,
        summary: summary,
      }, targetId);
    }
  });
}

function cleanup(calendarId, startDate) {
  let calendar = CalendarApp.getCalendarById(calendarId);
  let endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  calendar.getEvents(startDate, endDate).forEach(function (event) {
    try {
      console.log('Deleting event: ' + event.getAllDayStartDate().toLocaleDateString('sv'));
      event.deleteEvent();
    } catch (e) {
      console.log('Failed to delete: ' + e);
    }

    Utilities.sleep(500);
  });
}
