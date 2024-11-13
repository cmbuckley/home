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
    eventTypes: ['default', 'workingLocation'],
  });

  const locationMap = {
    homeOffice:     'Home',
    officeLocation: 'Office',
  };

  events.items.forEach(event => {
    // home or office looks like {type: 'homeOffice', homeOffice: {}}
    // custom looks like {type: 'customLocation', customLocation: {label: 'Foo'}}
    const props = event.workingLocationProperties;
    let summary;

    if (props) {
      summary = props[props.type].label || locationMap[props.type];
      console.log('Working location for ' + event.start.date + ' is ' + summary);
    } else if (event.summary == 'Holiday') {
      summary = 'Holiday';
      console.log('Holiday on ' + event.start.date);
    }

    if (summary) {
      Calendar.Events.insert({
        start:   event.start,
        end:     event.end,
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
