// CORS Proxy method for sending notifications (temporary solution)
export const sendNotificationViaCloudFunction = async (token, title, body, data = {}) => {
  try {
    console.log('🚀 Using CORS proxy for notification...');
    console.log('📱 Token:', token.substring(0, 20) + '...');
    console.log('📋 Title:', title);
    console.log('📝 Body:', body);

    // Use CORS proxy server to avoid CORS issues
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const fcmUrl = 'https://fcm.googleapis.com/fcm/send';
    
    const response = await fetch(proxyUrl + fcmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=AAAAZdRr3XA:APA91bF5Y6P1r0k6kPq7v8v9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x1y2z3',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: title,
          body: body,
          sound: 'default',
          icon: '/sadhanacutlogo.jpeg'
        },
        data: {
          type: 'message',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          ...data
        },
        priority: 'high'
      })
    });

    const responseData = await response.json();
    console.log('✅ CORS Proxy FCM Response:', responseData);

    if (response.ok && responseData.success) {
      return {
        success: true,
        messageId: responseData.message_id,
        response: responseData
      };
    } else {
      console.error('❌ FCM Error:', responseData);
      return {
        success: false,
        error: responseData.results?.[0]?.error || 'Failed to send notification'
      };
    }
  } catch (error) {
    console.error('❌ CORS Proxy error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};