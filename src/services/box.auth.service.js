// src/services/box.auth.service.js
const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config/box.config.js");
const querystring = require("querystring");
let key = {
  key: config.boxAppSettings.appAuth.privateKey,
  passphrase: config.boxAppSettings.appAuth.passphrase,
};
var BoxSDK = require("box-node-sdk");
var sdk = new BoxSDK({
  clientID: config.boxAppSettings.clientID,
  clientSecret: config.boxAppSettings.clientSecret,
  appAuth: {
    keyID: key.key,
    privateKey: config.boxAppSettings.appAuth.privateKey,
    passphrase: key.passphrase,
  },
});
/**
 * Generates a new Box API access token. This function is now stateless.
 * It returns the full token object with expiration data.
 */
// curl -i -X POST "https://api.box.com/oauth2/token" \
//      -H "content-type: application/x-www-form-urlencoded" \
//      -d "client_id=[CLIENT_ID]" \
//      -d "client_secret=[CLIENT_SECRET]" \
//      -d "code=[CODE]" \
//      -d "grant_type=authorization_code"
// const generateNewToken = async () => {
//   let data = querystring.stringify({
//     // client_id: "wtdpwkaby6uycdtc2m1t5gp1ztd9fh9l",
//     // client_secret: "1kLOOi5SoaRTyIXyi0wkCxPw0gcWw5tY",
//     // client_id: "dxike7gpjr1dxuwo6nl5ejgugiq0l3bl",
//     // client_secret: "b4MOIroWQtqdZPI9Gn1AgmD8zbAvBXve",
//     code: "[CODE]",
//     grant_type: "client_credentials",
//     box_subject_type: "user",
//     box_subject_id: "42869668490"
//   });
//   let config = {
//     method: "post",
//     maxBodyLength: Infinity,
//     url: "https://api.box.com/oauth2/token",
//     headers: {
//       "content-type": "application/x-www-form-urlencoded",
//       // Cookie: "box_visitor_id=68754eafdf7bb3.58019040; site_preference=desktop",
//     },
//     data: data,
//   };
//   try {
//     const response = await axios.request(config);
//     console.debug("🚀 ~ generateNewToken ~ response:", response.data);
//     return {
//       ...response.data,
//     };
//   } catch (error) {
//     console.debug("🚀 ~ generateNewToken ~ error:", error);
//   }
// };
const generateNewToken = async () => {
  try {
    const appUserClient =  sdk.getAppAuthClient("user", "42869668490");
    return appUserClient;
  } catch (error) {
    console.error(
      "Box token generation failed:",
      error.response?.data || error.message
    );
    throw new Error("Could not generate Box access token.");
  }
};
// const generateNewToken = async () => {
//   try {
//     const authenticationUrl = "https://api.box.com/oauth2/token";

//     let claims = {
//       iss: config.boxAppSettings.clientID,
//       sub: "42869668490",
//       box_sub_type: "user",
//       aud: authenticationUrl,
//       jti: crypto.randomBytes(64).toString("hex"),
//       exp: Math.floor(Date.now() / 1000) + 45,
//     };

//     let keyId = config.boxAppSettings.appAuth.publicKeyID;

//     let headers = {
//       algorithm: "RS512",
//       keyid: keyId,
//     };

//     let assertion = jwt.sign(claims, key, headers);
//     let accessToken = await axios
//       .post(
//         authenticationUrl,
//         querystring.stringify({
//           grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
//           assertion: assertion,
//           client_id: config.boxAppSettings.clientID,
//           client_secret: config.boxAppSettings.clientSecret,
//         })
//       )
//       .then((response) => response.data.access_token);
//     return {
//       access_token: accessToken,
//       expires_in: claims.exp,
//     };
//   } catch (error) {
//     console.error(
//       "Box token generation failed:",
//       error.response?.data || error.message
//     );
//     throw new Error("Could not generate Box access token.");
//   }
// };

module.exports = { generateNewToken };
