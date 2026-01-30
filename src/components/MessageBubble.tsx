import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Message, Attachment } from '../models/Message';
import { useAuthStore } from '../store/useAuthStore';
import { PresignService } from '../services/aws/PresignService';
import { CognitoAuthService } from '../services/aws/CognitoAuthService';
import { AWS_CONFIG } from '../config/config';
import ReactNativeBlobUtil from 'react-native-blob-util';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { user } = useAuthStore();
  const isOwnMessage = message.senderId === user?.userId;
  const [loadingAttachment, setLoadingAttachment] = useState<string | null>(null);

  const presignService = new PresignService(
    AWS_CONFIG.presignApi.url,
    new CognitoAuthService()
  );

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleAttachmentPress = async (attachment: Attachment) => {
    setLoadingAttachment(attachment.key);

    try {
      const { downloadUrl } = await presignService.presignDownload(attachment.key);

      const fileName =
        attachment.originalFileName ||
        attachment.key.split('/').pop() ||
        `attachment-${Date.now()}`;

      const extension = fileName.includes('.') ? '' : getExtensionFromMime(attachment.contentType);

      const fullFileName = extension ? `${fileName}${extension}` : fileName;

      // Use DownloadDir for Android, DocumentDir for iOS fallback
      const baseDir =
        Platform.OS === 'android'
          ? ReactNativeBlobUtil.fs.dirs.DownloadDir
          : ReactNativeBlobUtil.fs.dirs.DocumentDir;

      const targetPath = `${baseDir}/${fullFileName}`;

      const configOptions: any = {
        fileCache: true,
        path: targetPath,
      };

      // Android: Use system Download Manager → notification + Downloads folder (no permission dialog in most cases)
      if (Platform.OS === 'android') {
        configOptions.addAndroidDownloads = {
          useDownloadManager: true,
          notification: true,
          title: fullFileName,
          description: 'Downloading from chat...',
          mime: attachment.contentType || 'application/octet-stream',
          mediaScannable: true,
        };
      }

      const res = await ReactNativeBlobUtil.config(configOptions).fetch('GET', downloadUrl);

      const savedPath = res.path();

      console.log('File saved to:', savedPath);

      Alert.alert(
        'Download Complete',
        `File saved as "${fullFileName}"${
          Platform.OS === 'android' ? ' in Downloads folder' : ' in Files app (Documents)'
        }`
      );

      // Optional: Open after download (uncomment if wanted)
      // if (Platform.OS === 'android') {
      //   ReactNativeBlobUtil.android.actionViewIntent(savedPath, attachment.contentType);
      // }

    } catch (err: any) {
      console.error('Download failed:', err);
      Alert.alert(
        'Download Failed',
        err.message || 'Please check your connection and try again.'
      );
    } finally {
      setLoadingAttachment(null);
    }
  };

  // Helper to guess extension if missing
  const getExtensionFromMime = (mime?: string): string => {
    if (!mime) return '';
    if (mime.includes('pdf')) return '.pdf';
    if (mime.includes('image')) return '.jpg';
    if (mime.includes('word') || mime.includes('msword')) return '.docx';
    if (mime.includes('text')) return '.txt';
    return '';
  };

  const getFileIcon = (contentType: string, fileName?: string) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType === 'application/pdf') return '📄';
    if (contentType.includes('word') || contentType.includes('msword')) return '📝';
    if (fileName && /\.(doc|docx|pdf)$/i.test(fileName)) {
      return /\.pdf$/i.test(fileName) ? '📄' : '📝';
    }
    return '📎';
  };

  return (
    <View style={[styles.row, isOwnMessage ? styles.right : styles.left]}>
      <View style={[styles.bubble, isOwnMessage ? styles.mine : styles.other]}>
        {/* Sender Name */}
        {!isOwnMessage && (
          <Text style={styles.sender}>{message.senderDisplayName}</Text>
        )}

        {/* Attachments */}
        {message.attachments?.length > 0 && (
          <View style={styles.attachments}>
            {message.attachments.map((att, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.attachmentCard,
                  isOwnMessage ? styles.attachmentMine : styles.attachmentOther,
                ]}
                onPress={() => handleAttachmentPress(att)}
                disabled={loadingAttachment === att.key}
              >
                {loadingAttachment === att.key ? (
                  <ActivityIndicator color={isOwnMessage ? '#fff' : '#000'} />
                ) : (
                  <View style={styles.attachmentRow}>
                    <Text style={styles.icon}>
                      {getFileIcon(att.contentType, att.originalFileName)}
                    </Text>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {att.originalFileName || att.key.split('/').pop()}
                      </Text>

                      {att.sizeBytes && (
                        <Text style={styles.fileSize}>
                          {(att.sizeBytes / 1024).toFixed(1)} KB
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Message Text */}
        {message.text && (
          <Text
            style={[
              styles.text,
              isOwnMessage ? styles.textOwn : styles.textOther,
            ]}
          >
            {message.text}
          </Text>
        )}

        {/* Time */}
        <Text
          style={[
            styles.time,
            isOwnMessage ? styles.timeOwn : styles.timeOther,
          ]}
        >
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
    flexDirection: 'row',
  },

  left: {
    justifyContent: 'flex-start',
  },

  right: {
    justifyContent: 'flex-end',
  },

  bubble: {
    maxWidth: '78%',
    padding: 12,
    borderRadius: 14,
  },

  mine: {
    backgroundColor: '#2563eb',
  },

  other: {
    backgroundColor: '#e5e7eb',
  },

  sender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#4b5563',
  },

  attachments: {
    marginBottom: 6,
  },

  attachmentCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
  },

  attachmentMine: {
    borderColor: '#93c5fd',
    backgroundColor: '#3b82f6',
  },

  attachmentOther: {
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },

  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  icon: {
    fontSize: 22,
  },

  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000', // adjust if needed for contrast
  },

  fileSize: {
    fontSize: 11,
    color: '#6b7280',
  },

  text: {
    fontSize: 14,
    marginTop: 4,
  },

  textOwn: {
    color: '#ffffff',
  },

  textOther: {
    color: '#000000',
  },

  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  timeOwn: {
    color: '#e0f2fe',
  },

  timeOther: {
    color: '#6b7280',
  },
});