function copyEvents() {
  // source and target calendars
  var source = CalendarApp.getCalendarById('source@gmail.com');
  var target = CalendarApp.getCalendarById('target@gmail.com');

  // start and end dates
  var startDate = new Date();
  var endDate   = new Date();
  endDate.setDate(startDate.getDate() + 365);

  // copy all events
  source.getEvents(startDate, endDate).forEach(function (event) {
    const tagCopied = 'cce-copied';

    // ignore an event we’ve already copied
    if (event.getTag(tagCopied) == 'true') {
      return;
    }

    var title = event.getTitle();
    if (event.isAllDayEvent()) {
      target.createAllDayEvent(title, event.getAllDayStartDate());
    }
    else {
      target.createEvent(title, event.getStartTime(), event.getEndTime());
    }

    event.setTag(tagCopied, 'true'); // so we don't copy it again
    Utilities.sleep(250);
  });
}
