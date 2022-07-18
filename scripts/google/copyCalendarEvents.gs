function doGet() {
  return HtmlService.createHtmlOutput('<h1>Hello, world!</h1>');
}

function copyAll() {
  copyEvents('source.calendar@gmail.com', '[Other] ', CalendarApp.EventColor.PALE_RED, CalendarApp.Visibility.PRIVATE);
}

function copyEvents(sourceEmail, titlePrefix, eventColor, eventVisibility) {
  // source and target calendars
  let source = CalendarApp.getCalendarById(sourceEmail);
  let target = CalendarApp.getCalendarById(Session.getActiveUser().getEmail());
  const syncDays = 14;

  // start and end dates
  let startDate = new Date();
  let endDate   = new Date();
  endDate.setDate(startDate.getDate() + syncDays);

  // delete and recreate in case things move
  cleanup(syncDays, titlePrefix);

  // copy all events
  source.getEvents(startDate, endDate).forEach(function (event) {
    const title = titlePrefix + event.getTitle();
    console.log('Copying event: ' + event.getTitle() + ' (' + event.getStartTime().toLocaleString('en-GB') + ')');
    let newEvent;

    if (event.isAllDayEvent()) {
      newEvent = target.createAllDayEvent(title, event.getAllDayStartDate());
    }
    else {
      newEvent = target.createEvent(title, event.getStartTime(), event.getEndTime());
    }

    newEvent.setColor(eventColor);
    newEvent.setVisibility(eventVisibility || CalendarApp.Visibility.DEFAULT);
    Utilities.sleep(250);
  });
}

function cleanup(daysAhead, titlePrefix) {
  let calendar = CalendarApp.getCalendarById(Session.getActiveUser().getEmail());
  
  let startDate = new Date();
  let endDate   = new Date();
  endDate.setDate(startDate.getDate() + daysAhead);

  calendar.getEvents(startDate, endDate).forEach(function (event) {
    if (event.getTitle().startsWith(titlePrefix)) {
      console.log('Deleting event: ' + event.getTitle() + ' (' + event.getStartTime().toLocaleString('en-GB') + ')');
      event.deleteEvent();
      Utilities.sleep(250);
    }
  });
}
