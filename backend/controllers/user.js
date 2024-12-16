const { google } = require("googleapis");
const User = require("../models/Users");
const { createOAuthClientWithoutAccessToken } = require("../utils");
const Mapping = require("../models/Mappings");
exports.googleLogin = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res
        .status(400)
        .json({ message: "Authorization code is required" });
    }

    const oauth2Client = createOAuthClientWithoutAccessToken();

    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token || !expiry_date) {
      return res.status(400).json({ message: "Failed to retrieve tokens" });
    }

    oauth2Client.setCredentials({ access_token });

    // Fetch user profile information
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const userInfoResponse = await oauth2.userinfo.get();
    const { email, id: sub } = userInfoResponse.data;

    if (!email || !sub) {
      return res.status(400).json({ message: "Failed to retrieve user info" });
    }

    let user = await User.findOne({ email });

    if (user) {
      user.accessToken = access_token;
      user.refreshToken = refresh_token || user.refreshToken;
      user.expiryDate = expiry_date;
      await user.save();
    } else {
      user = new User({
        googleId: sub,
        email,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiryDate: expiry_date,
      });
      await user.save();
    }

    const mapping = await Mapping.findOne({
      userId: user._id,
      is_active: true,
    });
    if (!mapping) {
      const newMapping = {
        userId: user._id,
        mapping: [
            { name: "google_title", position: "A" },
            { name: "google_start_time", position: "B" },
            { name: "google_end_time", position: "C" },
          ]
      };

      await Mapping.create(newMapping);
    }

    // Automatically start watching Google Calendar events
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const watchResponse = await calendar.events.watch({
      calendarId: "primary",
      requestBody: {
        id: `channel-${user._id}-${Date.now()}`, // Unique channel ID
        type: "webhook",
        address: process.env.WEBHOOK_URL, // Your public webhook URL
      },
    });

    console.log("Watch started successfully:", watchResponse.data);

    res.status(200).json({
      message: "Google login successful",
      user: user._id,
      expiry_date,
    });
  } catch (error) {
    console.error("Error during Google login:", error.message);
    res
      .status(500)
      .json({ message: "Google login failed", error: error.message });
  }
};
