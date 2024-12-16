const { google } = require("googleapis");
const dotenv=require("dotenv");
dotenv.config()
exports.createOAuthClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
};

exports.ensureValidDateTime = (date, time) => {
  const dateTime = new Date(`${date}T${time}`);
  if (isNaN(dateTime.getTime())) {
    throw new Error("Invalid date or time format");
  }
  return dateTime;
};



exports.createOAuthClientWithoutAccessToken = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};
