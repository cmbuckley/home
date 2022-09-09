/**
 * Invoice factory
 * 
 * @param object options
 * @return StarSquareInvoice
 */
function create(options) {
  return new StarSquareInvoice(options);
}

class StarSquareInvoice {
  constructor(options) {
    this.options = options;
  }

  /**
   * Create and mail the invoice
   */
  send() {
    if (!this.shouldSendInvoice()) {
      Logger.log('Not sending invoice this month');
      return;
    }

    const invoices = this.options.invoices.map(this.createInvoice.bind(this));
    let mails = [];

    const mailOptions = {
      subject: this.options.subject,
      body: this.options.body,
      name: this.options.from,
      attachments: invoices.map(i => this.getAttachment(i, this.options.attachmentOptions)),
    };

    if (this.options.separateTo) {
      mails = this.options.separateTo.map(email => Object.assign({}, mailOptions, {to: email}));
    } else {
      mails = [Object.assign({}, mailOptions, {
        to: this.emailList(this.options.to),
        cc: this.emailList(this.options.cc),
        bcc: this.emailList(this.options.bcc),
      })];
    }

    mails.forEach(m => MailApp.sendEmail(m));
  }

  /**
   * Convert a list of emails to a comma-separated list
   * 
   * @param string|array|null emails
   * @return string|null
   */
  emailList(emails) {
    return ((emails && Array.isArray(emails)) ? emails.join(',') : emails);
  }

  /**
   * Whether the invoice should be send this month
   * 
   * @return bool
   */
  shouldSendInvoice() {
    let date = new Date();
    return (Array.isArray(this.options.months) ? this.options.months.includes(date.getMonth() + 1) : true);
  }

  /**
   * Create the invoice spreadsheet
   * 
   * @param object spec
   * @return Spreadsheet
   */
  createInvoice(spec) {
    const template = DriveApp.getFilesByName(spec.template).next(),
      filename = (spec.filename || spec.template) + ' - ' + this.getFileDate();

    // create invoice from template
    Logger.log('Creating invoice for ' + filename);

    const invoice = template.makeCopy(filename);
    const spreadsheet = SpreadsheetApp.openById(invoice.getId());
    const namedRanges = spreadsheet.getNamedRanges().map(r => r.getName());

    Object.keys(spec.values).forEach(range => {
      const func = (namedRanges.includes(range) ? 'getRangeByName' : 'getRange');
      spreadsheet[func](range).setValue(spec.values[range]);
    });

    return spreadsheet;
  }

  /**
   * Get date in dd.mm.yy format
   * 
   * @return string
   */
  getFileDate() {
    const date = new Date();
    return [
      ('0' + date.getDate()).slice(-2),
      ('0' + (date.getMonth() + 1)).slice(-2),
      (date.getFullYear() + '').slice(-2)
    ].join('.');
  }

  /**
   * Get the invoice attachment contents
   * 
   * @return object
   */
  getAttachment(spreadsheet, options) {
    // merge with default options
    options = Object.assign({}, {
      format: 'pdf',
      exportFormat: 'pdf',
      size: 7, // A4
      portrait: true,
      gridlines: false,
    }, options || {});

    Logger.log('Exporting PDF')
    SpreadsheetApp.flush();

    // construct export URL
    var query = Object.keys(options).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(options[key]);
    }).join('&');
    var exportUrl = spreadsheet.getUrl().replace(/\/edit.*$/, '/export?' + query);
    Logger.log('Downloading ' + exportUrl);
    
    // download file
    var response;
    for (var i = 0; i < 5; i++) {
      response = UrlFetchApp.fetch(exportUrl, {
        muteHttpExceptions: true,
        headers: {
          Authorization: 'Bearer ' +  ScriptApp.getOAuthToken(),
        },
      });

      if (response.getResponseCode() === 429) {
        // printing too fast, retry
        Utilities.sleep(3000);
      } else {
        break;
      }
    }
    
    return {
      fileName: spreadsheet.getName() + '.pdf',
      content:  response.getBlob().getBytes(),
      mimeType: MimeType.PDF,
    };
  }
}
