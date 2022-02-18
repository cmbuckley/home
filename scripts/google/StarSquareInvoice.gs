  /**
   * New invoice factory
   * 
   * @param string templateName
   * @param string recipient    email address
   * @param string invoiceMonth 1-based month number
   */
function newInvoice(templateName, recipient, invoiceMonth) {
  return new StarSquareInvoice(templateName, recipient, invoiceMonth);
}

class StarSquareInvoice {
  /**
   * @param string templateName
   * @param string recipient    email address
   * @param string invoiceMonth 1-based month number
   */
  constructor(templateName, recipient, invoiceMonth) {
    this.templateName = templateName;
    this.recipient = recipient;

    if (this.shouldCreateInvoice(invoiceMonth)) {
      this.createInvoice();
    } else {
      Logger.log('Not creating invoice this month');
    }
  }

  /**
   * Whether the invoice should be created this month
   * 
   * @return bool
   */
  shouldCreateInvoice(invoiceMonth) {
    let date = new Date();
    return (date.getMonth() == (invoiceMonth - 1));
  }

  /**
   * Create and mail the invoice
   */
  createInvoice() {
    const template = DriveApp.getFilesByName(this.templateName + ' Template').next(),
      files = template.getParents().next().getFiles();
    let invoiceNum = 1;

    // find out invoice number
    while (files.hasNext()) {
      if (/^010/.test(files.next().getName())) {
        invoiceNum++;
      }
    }

    // create invoice from template
    const invoiceName = '01' + ('0000' + invoiceNum).substr(-4);
    Logger.log('Creating invoice ' + invoiceName);

    const invoice = template.makeCopy(invoiceName + ' - ' + this.templateName + ' ' + this.getDate());
    const spreadsheet = SpreadsheetApp.openById(invoice.getId());
    spreadsheet.getRangeByName('Invoice_ID').setValue(invoiceNum);
    spreadsheet.getRangeByName('Invoice_Date').setValue(new Date());

    // send email with spreadsheet as attachment
    MailApp.sendEmail(this.recipient, 'Invoice ' + invoiceName + ' Available', this.getEmailBody(), {
      name: 'StarSquare Billing',
      attachments: [this.getAttachment(spreadsheet)]
    });
  }
  
  /**
   * Get date in dd.mm.yy format
   */
  getDate() {
    const date = new Date();
    return [
      ('0' + date.getDate()).substr(-2),
      ('0' + (date.getMonth() + 1)).substr(-2),
      (date.getFullYear() + '').substr(-2)
    ].join('.');
  }

  getEmailBody() {
    return `Hi,

We are pleased to inform you that your latest invoice is available.

Please feel free to contact sales@starsquare.co.uk should you have any questions or require additional assistance.

Best regards,

StarSquare Designs`;
  }

  /**
   * get the invoice attachment contents
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

    // construct export URL
    var query = Object.keys(options).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(options[key]);
    }).join('&');
    var exportUrl = spreadsheet.getUrl().replace(/\/edit.*$/, '/export?' + query);
    Logger.log("Downloading " + exportUrl);
    
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
