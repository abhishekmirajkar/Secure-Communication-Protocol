const express = require("express");
const app = express();
const PORT = 3001;
const bodyParser = require("body-parser");
const crypto = require("crypto");

app.use(bodyParser.json());

const users = {
  user1: "Hashedpassword",
  user2: "Hashedpassword",
};

let sessionKeys = {};

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

app.post("/hello", (req, res) => {

  const { username, mac, data } = req.body;

  if (users[username]) {
    const secretKey = crypto.randomBytes(32).toString("hex");

    const hMac = crypto.createHmac("sha256", secretKey + mac).digest("hex");

    sessionKeys[username] = { secretKey, hMac };
    res.json({ status: "SUCCESS", secretKey: secretKey, data: "HELLO_ACK" });
  } else {
    res.status(400).json({ status: "ERROR", message: "CLOSE :Invalid user" });
  }
});

app.post("/data_request", (req, res) => {
  const { data, mac, secretKey, username } = req.body;

  if (!sessionKeys[username]) {
    return res.json({ status: "ERROR", message: "CLOSE :Invalid user" });
  }

  const hMac = crypto.createHmac("sha256", secretKey + mac).digest("hex");
  try {
    if (hMac == sessionKeys[username].hMac) {
      if (data === "CLOSE") {
        sessionKeys = {};
        console.log("Connection closed successfully");
        return res.json({ status: "SUCCESS", message: "CLOSE" });
      }

      console.log("\nData received");
      console.log("\nData is encrypted");
      console.log("\nEncryped data is - ", data);

      console.log("\nDecrypting data now........");

      const decryptedData = decryptString(data, secretKey);
      console.log("\nDecrypted data is ", decryptedData);

      const responseData = "Response_ACK " + decryptedData;
      console.log("\nData response is : ", responseData);

      console.log("\nEncrypting data now........");
      const encryptedResponse = encryptString(responseData, secretKey);

      console.log("Encrypted response is ", encryptedResponse);

      console.log("\nResponse sent!");

      console.log("------------------------------------------------");
      return res.json({ status: "SUCCESS", data: encryptedResponse });
    }
  } catch (ex) {
    return res.status(400).json({
      status: "ERROR",
      message: "CLOSE :There was some error which pricessing the data",
    });
  }

  return res
    .status(400)
    .json({ status: "ERROR", message: "CLOSE :Invalid user" });
});

app.listen(PORT, () =>
  console.log("Server started successfully!\nReady to accept data\n")
);
