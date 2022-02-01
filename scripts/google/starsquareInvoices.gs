function checkCreateInvoice() {
  var date = new Date();
  if (date.getMonth() != 9) { // October
    return Logger.log('Not creating invoice in month ' + date.getMonth());
  }

  // @todo nice way to do this per invoice template
  createInvoice('New Invoice', 'test@starsquare.co.uk');
}

function createInvoice(templateName, recipient) {
  var template = DriveApp.getFilesByName(templateName + ' Template').next(),
    files = template.getParents().next().getFiles(),
    invoiceNum = 1;

  // find out invoice number
  while (files.hasNext()) {
    if (/^010/.test(files.next().getName())) {
      invoiceNum++;
    }
  }

  // create invoice from template
  var invoiceName = '01' + ('0000' + invoiceNum).substr(-4);
  Logger.log('Creating invoice ' + invoiceName);
  var invoice = template.makeCopy(invoiceName + ' - ' + templateName + ' ' + getDate());
  var spreadsheet = SpreadsheetApp.openById(invoice.getId());
  spreadsheet.getRangeByName('Invoice_ID').setValue(invoiceNum);
  spreadsheet.getRangeByName('Invoice_Date').setValue(new Date());

  // send email with spreadsheet as attachment
  MailApp.sendEmail(recipient, 'Invoice ' + invoiceName + ' Available', getEmailBody(), {
    name: 'StarSquare Billing',
    attachments: [getAttachment(spreadsheet)]
  });
}

// get date in dd.mm.yy format
function getDate() {
  var date = new Date();
  return [
    ('0' + date.getDate()).substr(-2),
    ('0' + (date.getMonth() + 1)).substr(-2),
    (date.getFullYear() + '').substr(-2)
  ].join('.');
}

// get the invoice attachment contents
function getAttachment(spreadsheet, options) {
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

function getEmailBody() {
  return `Hi,

We are pleased to inform you that your latest invoice is available.

Please feel free to contact sales@starsquare.co.uk should you have any questions or require additional assistance.

Best regards,

StarSquare Designs`;
}
