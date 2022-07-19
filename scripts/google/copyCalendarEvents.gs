const config = {
  'source.calendar@gmail.com': {
    prefix: 'Example',
    color: CalendarApp.EventColor.PALE_RED,
    visibility: 'private'
  },
};

function doGet() {
  return HtmlService.createHtmlOutput('<h1>Hello, world!</h1>');
}

function onCalendarChanged(trigger) {
  copyEvents(trigger.calendarId);
}

function copyAll() {
  Object.keys(config).forEach(copyEvents);
}

function copyEvents(sourceId) {
  // avoid multiple scripts running at the same time
  const lock = LockService.getScriptLock();
  lock.tryLock(1000);
  if (!lock.hasLock()) {
    console.log('Process already running');
    return;
  }

  console.log('Copying events from ' + sourceId);
  const summaryPrefix = (config[sourceId].prefix ? `[${config[sourceId].prefix}] ` : '');
  const syncDays = config[sourceId].syncDays || 14;

  // start and end dates
  let startDate = new Date();
  let endDate   = new Date();
  endDate.setDate(startDate.getDate() + syncDays);

  // delete and recreate in case things move
  cleanup(syncDays, summaryPrefix);

  // get all events
  const listResponse = Calendar.Events.list(sourceId, {
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
  });

  // loop over and copy
  listResponse.items.forEach(function (event) {
    console.log('Copying event: ' + event.summary + ' (' + event.start + ')');

    const n = Calendar.Events.insert({
      start:          event.start,
      end:            event.end,
      summary:        summaryPrefix + event.summary,
      description:    event.description,
      conferenceData: event.conferenceData,
      colorId:        config[sourceId].color || 0,
      visibility:     config[sourceId].visibility || event.visibility
    }, Session.getActiveUser().getEmail(), {
      conferenceDataVersion: 1
    });

    Utilities.sleep(500);
  });

  lock.releaseLock();
  console.log('All events copied');
}

function cleanup(daysAhead, titlePrefix) {
  let calendar = CalendarApp.getCalendarById(Session.getActiveUser().getEmail());
  
  let startDate = new Date();
  let endDate   = new Date();
  endDate.setDate(startDate.getDate() + daysAhead);

  calendar.getEvents(startDate, endDate).forEach(function (event) {
    if (event.getTitle().startsWith(titlePrefix)) {
      console.log('Deleting event: ' + event.getTitle() + ' (' + event.getStartTime().toLocaleString('en-GB') + ')');
      try {
        event.deleteEvent();
      } catch (e) {
        console.log('Failed to delete: ' + e);
      }
      Utilities.sleep(500);
    }
  });
}
