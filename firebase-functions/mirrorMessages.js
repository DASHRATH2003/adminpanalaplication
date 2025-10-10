const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Firestore Trigger: Mirror every new message under conversations/{conversationId}/messages
 * into the corresponding user's subcollection: users/{userId}/messages
 *
 * Mirroring logic:
 * - If message.senderType === 'user' and senderId exists → mirror to users/{senderId}/messages
 * - Else if recipientId exists → mirror to users/{recipientId}/messages
 * - Safe no-op if userId cannot be determined
 */
exports.mirrorConversationMessage = functions.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const message = snap.data() || {};
      const { conversationId } = context.params;

      const senderType = message.senderType || null;
      const senderId = message.senderId || null;
      const recipientId = message.recipientId || null;

      // Prevent infinite loops: skip if this was mirrored from user side
      if (message.mirroredFromUser) {
        console.log('⏭️ Skipping user→conversation mirrored message from being mirrored back to user.', {
          conversationId,
          messageId: context.params.messageId
        });
        return null;
      }

      // Determine target user for mirroring
      let targetUserId = null;
      if (senderType === 'user' && senderId) {
        targetUserId = senderId;
      } else if (recipientId) {
        targetUserId = recipientId;
      }

      if (!targetUserId) {
        console.warn('⚠️ Mirror skipped: No target userId resolved', {
          conversationId,
          senderType,
          senderId,
          recipientId
        });
        return null;
      }

      const db = admin.firestore();

      const mirrorPayload = {
        ...message,
        conversationId: message.conversationId || conversationId,
        mirroredFromConversation: conversationId,
        mirroredAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db
        .collection('users')
        .doc(targetUserId)
        .collection('messages')
        .add(mirrorPayload);

      console.log('✅ Mirrored message to user messages:', {
        userId: targetUserId,
        conversationId,
        messageId: context.params.messageId
      });

      return null;
    } catch (error) {
      console.error('❌ Error mirroring message to user messages:', error);
      return null;
    }
  });

/**
 * Firestore Trigger: Mirror every new message under users/{userId}/messages
 * into that user's direct conversation: conversations/{conversationId}/messages
 *
 * Logic:
 * - If message.conversationId exists, use it directly
 * - Else find conversation where customerId == userId
 * - If none found, create a conversation for the user (support-style fallback)
 * - Mark message with mirroredFromUser to prevent loop
 */
exports.mirrorUserMessageToConversation = functions.firestore
  .document('users/{userId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const message = snap.data() || {};
      const { userId } = context.params;

      // Prevent infinite loops: if this originated from conversation mirroring, skip
      if (message.mirroredFromConversation) {
        console.log('⏭️ Skipping conversation→user mirrored message.', {
          userId,
          messageId: context.params.messageId
        });
        return null;
      }

      const db = admin.firestore();

      // Determine target conversation
      let targetConversationId = message.conversationId || null;

      // Try finding by customerId
      if (!targetConversationId) {
        const convByIdSnap = await db
          .collection('conversations')
          .where('customerId', '==', userId)
          .limit(1)
          .get();
        if (!convByIdSnap.empty) {
          targetConversationId = convByIdSnap.docs[0].id;
        }
      }

      // Try finding by customerEmail if provided
      if (!targetConversationId) {
        const senderEmail = message.senderEmail || message.email || null;
        if (senderEmail) {
          const convByEmailSnap = await db
            .collection('conversations')
            .where('customerEmail', '==', senderEmail)
            .limit(1)
            .get();
          if (!convByEmailSnap.empty) {
            targetConversationId = convByEmailSnap.docs[0].id;
          }
        }
      }

      // Create a normal conversation if none exists (no support fallback)
      if (!targetConversationId) {
        const newConvRef = await db.collection('conversations').add({
          customerId: userId,
          customerName: message.senderName || message.senderEmail || 'Unknown User',
          customerEmail: message.senderEmail || null,
          avatar: message.senderAvatar || '',
          isOnline: false,
          lastMessage: message.message || '',
          lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
          unreadCount: 1
        });
        targetConversationId = newConvRef.id;
      }

      const convMessagesRef = db
        .collection('conversations')
        .doc(targetConversationId)
        .collection('messages');

      const mirrorPayload = {
        ...message,
        conversationId: targetConversationId,
        senderType: message.senderType || 'user',
        senderId: message.senderId || userId,
        recipientId: message.recipientId || 'admin',
        mirroredFromUser: userId,
        mirroredAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await convMessagesRef.add(mirrorPayload);

      // Update conversation metadata
      await db.collection('conversations').doc(targetConversationId).set({
        lastMessage: message.message || '',
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageSender: mirrorPayload.senderId
      }, { merge: true });

      console.log('✅ Mirrored user message to conversation:', {
        userId,
        conversationId: targetConversationId,
        messageId: context.params.messageId
      });

      return null;
    } catch (error) {
      console.error('❌ Error mirroring user message to conversation:', error);
      return null;
    }
  });