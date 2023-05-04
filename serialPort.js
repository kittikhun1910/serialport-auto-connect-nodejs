const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const EventEmitter = require("events");

const baudRate = 19200;

const findPort = async () => {
  const ports = await SerialPort.list();
  if (ports.length > 0) {
    console.log(`Using port ${ports[0].path}`);
    return ports[0].path;
  } else {
    throw new Error("No serial ports available");
  }
};
const openPort = async (portPath) => {
  const port = new SerialPort({ path: portPath, baudRate });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  parser.on("data", (data) => {
    console.log(`Received data: ${data}`);
  });

  let isReconnecting = false;

  const startDataTransmission = () => {
    const data = Buffer.from([0x02, 0x01, 0x43, 0x53, 0x34, 0x31, 0x14, 0x03]);
    port.write(data, (err) => {
      if (err) {
        console.log("Error on write: ", err.message);
        if (!isReconnecting) {
          console.log("Attempting to reconnect...");
          isReconnecting = true;
          setTimeout(() => {
            startDataTransmission();
          }, 5000); // Reconnect after 5 seconds
        }
      } else {
        console.log("Data written successfully! =>>", data);
        setTimeout(() => {
          startDataTransmission();
        }, 1000); // Write the data every 1 second
      }
    });
  };

  port.on("open", () => {
    console.log(`Serial port ${portPath} opened successfully!`);

    // Start sending data
    startDataTransmission();
  });

  // Listen for errors on the serial port
  port.on("error", (err) => {
    console.log("Error: ", err.message);
    if (!isReconnecting) {
      console.log("Attempting to reconnect...");
      isReconnecting = true;
      setTimeout(() => {
        port.open((err) => {
          if (err) {
            console.log(`Error reopening port ${portPath}: ${err.message}`);
            startDataTransmission(); // Try again to start data transmission
          } else {
            console.log(`Port ${portPath} reopened successfully!`);
            isReconnecting = false;
          }
        });
      }, 5000); // Reconnect after 5 seconds
    }
  });

  // Listen for cancellation signal
  process.on("SIGINT", () => {
    console.log("Cancellation signal received. Closing port...");
    port.close((err) => {
      if (err) {
        return console.log("Error on close: ", err.message);
      }
      console.log("Port closed successfully!");
    });
  });
};

const eventEmitter = new EventEmitter();

eventEmitter.on("list", (ports) => {
  console.log("Available ports:");
  ports.forEach((port) => {
    console.log(`- ${port.path}`);
  });

  findPort()
    .then((portPath) => {
      openPort(portPath);
    })
    .catch((err) => {
      console.log(`Error finding port: ${err.message}`);
    });
});

SerialPort.list().then((ports) => {
  eventEmitter.emit("list", ports);
});