const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function to send FCM notifications
 * This avoids CORS issues by running on the backend
 */
exports.sendNotification = functions.https.onCall(async (data, context) => {
  try {
    const { token, title, body, data: notificationData } = data;

    // Validate input
    if (!token || !title || !body) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    console.log('📤 Sending FCM notification...');
    console.log('📱 Token:', token.substring(0, 20) + '...');
    console.log('📋 Title:', title);
    console.log('📝 Body:', body);

    // Create the message
    const message = {
      token: token,
      notification: {
        title: title,
        body: body
      },
      data: notificationData || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    };

    // Send the notification
    const response = await admin.messaging().send(message);
    
    console.log('✅ Notification sent successfully:', response);
    
    return {
      success: true,
      messageId: response,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    
    // Handle specific FCM errors
    if (error.code === 'messaging/invalid-registration-token') {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid FCM token');
    } else if (error.code === 'messaging/registration-token-not-registered') {
      throw new functions.https.HttpsError('not-found', 'FCM token not registered');
    } else if (error.code === 'messaging/message-rate-exceeded') {
      throw new functions.https.HttpsError('resource-exhausted', 'Message rate limit exceeded');
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

/**
 * Cloud Function to send notifications to multiple tokens
 */
exports.sendMulticastNotification = functions.https.onCall(async (data, context) => {
  try {
    const { tokens, title, body, data: notificationData } = data;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'No tokens provided');
    }

    console.log(`📤 Sending multicast notification to ${tokens.length} tokens...`);
    console.log('📋 Title:', title);
    console.log('📝 Body:', body);

    const message = {
      notification: {
        title: title,
        body: body
      },
      data: notificationData || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    };

    const response = await admin.messaging().sendMulticast({
      ...message,
      tokens: tokens
    });

    console.log('✅ Multicast notification sent:', response);
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };

  } catch (error) {
    console.error('❌ Error sending multicast notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send multicast notification');
  }
});