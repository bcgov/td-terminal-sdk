import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';


// Replace '/dev/tty-usbserial1' with the correct serial port path for your system
const port = new SerialPort({ path: '/dev/tty.usbmodem21301', baudRate: 115200 });

const parser = port.pipe(new ReadlineParser({ delimiter: '\x03' })); // Use ETX as the delimiter

// Send a request message to the device
function sendRequest(request) {
  const STX = '\x02';
  const ETX = '\x03';
  const FS = '\x1C';

  const requestData = `/cgi-bin/cardpayment${FS}${request}`;
  const message = `${STX}${requestData}${ETX}`;
  const LRC = calculateLRC(requestData + ETX);
  
  port.write(message + LRC);
}

// Calculate the LRC for a given string
function calculateLRC(str) {
  let lrc = 0;
  for (const char of str) {
    lrc ^= char.charCodeAt(0);
  }
  return String.fromCharCode(lrc);
}

// Parse a response message from the device
function parseResponse(data) {

    console.log(data);
  const STX = '\x02';
  const ETX = '\x03';
  const FS = '\x1C';

  if (data[0] !== STX) {
    console.error('Invalid message received');
    return;
  }

  const etxIndex = data.indexOf(ETX);
  if (etxIndex < 0) {
    console.error('Invalid message received');
    return;
  }

  const lrc = data[etxIndex + 1];
  const lrcCalculated = calculateLRC(data.slice(1, etxIndex + 1));
  if (lrc !== lrcCalculated) {
    console.error('Invalid LRC received');
    return;
  }

  const responseData = data.slice(1, etxIndex).split(FS);
  const contentType = responseData[0];
  const response = responseData[1];

  return { contentType, response };
}

// Send an example request
sendRequest(`<?xml version="1.0" encoding="utf-8" ?>
<Request TranID="437" Type="Purchase" Version="1.0">
<Amount>1000</Amount>
<RefNumber>2017010156</RefNumber>
<Receipt>1</Receipt>
</Request>`);

// Listen for response messages
parser.on('data', (data) => {
  const response = parseResponse(data);
  if (response) {
    console.log('Received response:', response);
  }
});

// Error handling
port.on('error', (err) => {
  console.error('Error:', err.message);
});
