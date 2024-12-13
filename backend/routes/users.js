const express = require('express');
const { google } = require('googleapis');
const User = require('../models/Users');
const router = express.Router();

/**
 * Handles the Google login process for the application.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 *
 * @returns {Promise<void>}
 */
router.post('/google-login', async (req, res) => {
  try {
    const { code } = req.body;

    // Check if the authorization code is provided
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    // Check if access token and expiry date are retrieved
    if (!access_token || !expiry_date) {
      return res.status(400).json({ message: 'Failed to retrieve tokens' });
    }

    // Set credentials to fetch user information
    oauth2Client.setCredentials({ access_token });

    // Fetch user profile information
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfoResponse = await oauth2.userinfo.get();
    const { email, id: sub } = userInfoResponse.data;

    // Check if email and sub (Google user ID) are retrieved
    if (!email || !sub) {
      return res.status(400).json({ message: 'Failed to retrieve user info' });
    }

    // Check if the user exists in the database or create a new one
    let user = await User.findOne({ email });

    if (user) {
      user.accessToken = access_token;
      user.refreshToken = refresh_token || user.refreshToken; // Update refreshToken if provided
      user.expiryDate = expiry_date;
      await user.save();
    } else {
      console.log('Creating new user...');
      user = new User({
        googleId: sub,
        email,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiryDate: expiry_date,
      });
      await user.save();
    }

      // Automatically start watching Google Calendar events
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const watchResponse = await calendar.events.watch({
        calendarId: 'primary',
        requestBody: {
          id: `channel-${user._id}-${Date.now()}`, // Unique channel ID
          type: 'webhook',
          address: process.env.WEBHOOK_URL, // Your public webhook URL
        },
      });
  
      console.log('Watch started successfully:', watchResponse.data);

    // Return success response with user ID and expiry date
    res.status(200).json({
      message: 'Google login successful',
      user: user._id,
      expiry_date,
    });
  } catch (error) {
    // Log error and return failure response
    console.error('Error during Google login:', error.message);
    res.status(500).json({ message: 'Google login failed', error: error.message });
  }
});


module.exports = router;
