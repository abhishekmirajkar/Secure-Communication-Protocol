const express = require("express");
const crypto = require("crypto");
const app = express();
const bodyParser = require("body-parser");
const PORT = 3002;

var secretKey = null;

const username = "user1";
const macAddress = "00-B0-D0-63-C2-26";

function encryptString(data, key) {
  const cipher = crypto.createCipher("aes-128-cbc", key);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decryptString(encryptedData, key) {
  const decipher = crypto.createDecipher("aes-128-cbc", key);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

async function initialzeConnection() {
  const requestData = {
    username: username,
    mac: macAddress,
    data: "HELLO",
  };
  try {
    const response = await fetch("http://localhost:3001/hello", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (result.status === "SUCCESS") {
      secretKey = result.secretKey;
      console.log("Response data: ", result);
      startCommunication();
    }
  } catch (error) {
    console.error(error);
  }
}

async function startCommunication() {
  try {
    let count = 1;

    let interval = setInterval(async () => {
      console.log(count);
      await sendDataRequest(count);
      count++;

      if (count > 30) {
        clearInterval(interval);
        await closePortal();
      }
    }, 1000);
  } catch (error) {
    console.error(error);
  }
}

async function sendDataRequest(count) {
  const trnasmitData = "Sequence data sending in " + count;

  console.log("Data is: ", trnasmitData);
  console.log("\nEncryping data now......");
  const encryptedData = encryptString(trnasmitData, secretKey);

  console.log("\nEncrypted data is: ", encryptedData);
  console.log("\nSending data to the server.....");

  const dataPacket = {
    username: username,
    mac: macAddress,
    secretKey: secretKey,
    data: encryptedData,
  };
  const response = await fetch("http://localhost:3001/data_request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataPacket),
  });
  console.log("\nData sent successfully");
  const result = await response.json();
  const encryptedReponse = result.data;
  console.log("\nReceived encrypted data");

  console.log("\nEncrypted data is ", encryptedReponse);

  console.log("\nDecrypting data.....");

  const decryptedResponse = decryptString(encryptedReponse, secretKey);

  console.log("\nDecryption successfully");

  console.log("Decrypted reponse data is ", decryptedResponse);

  console.log("_____________________________________________________");
}

async function closePortal() {
  console.log("Closeing connection now");
  const dataPacket = {
    username: username,
    mac: macAddress,
    secretKey: secretKey,
    data: "CLOSE",
  };
  const response = await fetch("http://localhost:3001/data_request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataPacket),
  });

  console.log("Connection closed successfully");
}
app.listen(PORT, () => console.log("Client Server started successfully!"));

initialzeConnection();


//timestamp and custom secret key on both the side