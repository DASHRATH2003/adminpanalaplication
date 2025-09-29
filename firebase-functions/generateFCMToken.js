const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Universal FCM Token Generator
 * This function automatically generates FCM token when any user logs in
 * from any platform (web, mobile, admin panel)
 */
exports.generateFCMOnLogin = functions.auth.user().onCreate(async (user) => {
  try {
    console.log('New user created:', user.uid);
    
    // For mobile app users who register
    await generateTokenForUser(user.uid, user.email);
    
  } catch (error) {
    console.error('Error in generateFCMOnLogin:', error);
  }
});

/**
 * Generate FCM token for existing user
 * This can be called from any client (mobile app, web, admin panel)
 */
exports.generateTokenForExistingUser = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const userId = context.auth.uid;
    const { deviceInfo, platform } = data;
    
    console.log('Generating FCM token for user:', userId);
    
    // Generate a mock FCM token (in production, this should come from client)
    const fcmToken = generateMockFCMToken(userId);
    
    // Save to Firestore
    await saveFCMTokenToFirestore(userId, fcmToken, deviceInfo, platform);
    
    return {
      success: true,
      fcmToken: fcmToken,
      message: 'FCM token generated and saved successfully'
    };
    
  } catch (error) {
    console.error('Error in generateTokenForExistingUser:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Save FCM token to Firestore
 */
async function saveFCMTokenToFirestore(userId, fcmToken, deviceInfo = {}, platform = 'unknown') {
  try {
    const db = admin.firestore();
    
    const userData = {
      fcmToken: fcmToken,
      fcmTokenGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      notificationPermission: 'granted',
      deviceInfo: {
        platform: platform,
        userAgent: deviceInfo.userAgent || 'unknown',
        timestamp: new Date().toISOString(),
        ...deviceInfo
      },
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update user document
    await db.collection('users').doc(userId).set(userData, { merge: true });
    
    // Also create/update token document for tracking
    await db.collection('user_tokens').doc(userId).set({
      userId: userId,
      tokens: [{
        token: fcmToken,
        platform: platform,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
        active: true
      }],
      totalTokens: 1
    }, { merge: true });
    
    console.log('FCM token saved to Firestore for user:', userId);
    
  } catch (error) {
    console.error('Error saving FCM token to Firestore:', error);
    throw error;
  }
}

/**
 * Generate mock FCM token for testing
 * In production, this should be replaced with actual FCM token from client
 */
function generateMockFCMToken(userId) {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `mock_fcm_token_${userId}_${timestamp}_${randomPart}`;
}

/**
 * Generate FCM token for new user
 */
async function generateTokenForUser(userId, email) {
  try {
    const fcmToken = generateMockFCMToken(userId);
    
    await saveFCMTokenToFirestore(userId, fcmToken, {
      email: email,
      registrationType: 'automatic'
    }, 'auto-generated');
    
    console.log('FCM token generated for new user:', userId);
    
  } catch (error) {
    console.error('Error generating token for user:', error);
  }
}

/**
 * Cleanup old/inactive tokens
 */
exports.cleanupInactiveTokens = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    const db = admin.firestore();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days old
    
    const inactiveTokens = await db.collection('user_tokens')
      .where('tokens.lastUsedAt', '<', cutoffDate)
      .get();
    
    const batch = db.batch();
    inactiveTokens.forEach(doc => {
      batch.update(doc.ref, { 'tokens.$.active': false });
    });
    
    await batch.commit();
    console.log('Cleaned up inactive tokens');
    
  } catch (error) {
    console.error('Error cleaning up tokens:', error);
  }
});