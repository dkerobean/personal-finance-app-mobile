const axios = require('axios');

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

/**
 * Send a push notification via OneSignal
 * @param {Object} options
 * @param {string[]} options.include_external_user_ids - Array of user IDs to send to
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification body
 * @param {Object} [options.data] - Additional data to send
 */
const sendNotification = async ({ include_external_user_ids, title, message, data = {} }) => {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('OneSignal credentials missing. Notification not sent.');
    return;
  }

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids, // Matches the userId set in frontend
        headings: { en: title },
        contents: { en: message },
        data,
        channel_for_external_user_ids: 'push',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );

    console.log('OneSignal Notification Sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending OneSignal notification:', error.response?.data || error.message);
    // Don't throw, just log - we don't want to break the main flow if push fails
  }
};

module.exports = {
  sendNotification,
};
