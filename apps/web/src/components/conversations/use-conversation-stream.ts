'use client';

import type {
  ConversationDetail,
  ConversationStreamEvent,
  CurrentUserResponse,
} from '@aiaget/shared-types';
import type { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  ApiClientError,
  streamConversationMessage,
} from '@/lib/api-client';

export function useConversationStream({
  conversation,
  conversationId,
  currentUser,
  queryClient,
}: {
  conversation: ConversationDetail | null;
  conversationId: string;
  currentUser: CurrentUserResponse | null | undefined;
  queryClient: QueryClient;
}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  async function sendReplyStream(message: string) {
    if (!conversation) return;

    const temporaryUserMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'USER' as const,
      content: message,
      references: [],
      tool_calls: [],
      created_at: new Date().toISOString(),
      created_by: currentUser?.user
        ? {
            id: currentUser.user.id,
            name: currentUser.user.name,
            email: currentUser.user.email,
          }
        : null,
    };
    const temporaryAssistantMessage = {
      id: 'temp-assistant-stream',
      role: 'ASSISTANT' as const,
      content: '',
      references: [],
      tool_calls: [],
      created_at: new Date().toISOString(),
      created_by: null,
    };

    queryClient.setQueryData<ConversationDetail | undefined>(['conversation', conversationId], (current) => {
      if (!current) return current;

      return {
        ...current,
        message_count: current.message_count + 2,
        messages: [...current.messages, temporaryUserMessage, temporaryAssistantMessage],
      };
    });

    setReplyError(null);
    setIsStreaming(true);

    try {
      await streamConversationMessage(conversationId, { message }, {
        onEvent: (event) => handleStreamEvent(event),
      });
    } catch (error) {
      setReplyError(error instanceof ApiClientError ? error.message : '流式回复失败。');
      setIsStreaming(false);
      await queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    }
  }

  function handleStreamEvent(event: ConversationStreamEvent) {
    if (event.type === 'start') {
      return;
    }

    if (event.type === 'delta') {
      queryClient.setQueryData<ConversationDetail | undefined>(['conversation', conversationId], (current) => {
        if (!current) return current;

        return {
          ...current,
          messages: current.messages.map((message) =>
            message.id === 'temp-assistant-stream'
              ? {
                  ...message,
                  content: `${message.content}${event.delta}`,
                }
              : message,
          ),
        };
      });
      return;
    }

    if (event.type === 'error') {
      setReplyError(event.message);
      setIsStreaming(false);
      void queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      return;
    }

    queryClient.setQueryData(['conversation', conversationId], event.conversation);
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    setIsStreaming(false);
  }

  return {
    isStreaming,
    replyError,
    sendReplyStream,
    setReplyError,
  };
}
