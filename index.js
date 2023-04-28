import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

// list serial ports:
SerialPort.list().then (
  ports => ports.forEach(port =>console.log(port.path)),
  err => console.log(err)
)

const serialport = new SerialPort({ path: '/dev/tty.usbmodem21301', baudRate: 115200 });

function calculateLRC(str) {
  var bytes = [];
  var lrc = 0;
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  for (let i = 0; i < str.length; i++) {
    lrc ^= bytes[i];
  }
  return String.fromCharCode(lrc);
}

// [STX]<data>[ETX][LRC]

const stx = String.fromCharCode(2);
const etx = String.fromCharCode(3);

const ack = String.fromCharCode(6);


// const stx = '\002';
// const etx = '\003';
// const FS = String.fromCharCode(28);
const FS = '\x1C';
const transaction_type = "00"

// const data_field = `${FS}${TAG}${data}`
const data = `${transaction_type}${FS}0011000`;



// const data = `/cgi-bin/tms`;


const lrc = calculateLRC(data.concat(etx));

const message = `${stx}${data}${etx}${lrc}`;

console.log(message);


serialport.write(message, function (err) {
  if (err) {
    return console.log('Error on write: ', err.message);
  }
  console.log('message written');
});

// const parser = serialport.pipe(new ReadlineParser({ delimiter: '\r\n' }));
const parser = new ReadlineParser();
serialport.pipe(parser);




serialport.on('data', (data) => {
  console.log('write:');
  console.log(data);
  console.log(data.toString('utf-8'));
});




serialport.on('error', function(err) {
  console.log('Error: ', err.message)
})