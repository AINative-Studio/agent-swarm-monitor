'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check } from 'lucide-react';
import { Message } from '@/lib/conversation-types';
import 'highlight.js/styles/github-dark.css';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [showCopyButton, setShowCopyButton] = useState(false);

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const isUserMessage = message.role === 'user';
  const bgColor = isUserMessage ? 'bg-blue-50' : 'bg-gray-50';
  const borderColor = isUserMessage ? 'border-blue-200' : 'border-gray-200';

  return (
    <article
      data-testid="message-item"
      role="article"
      className={`${bgColor} border ${borderColor} rounded-lg p-4 md:p-6 mb-4 transition-all duration-200 hover:shadow-md relative`}
      onMouseEnter={() => setShowCopyButton(true)}
      onMouseLeave={() => setShowCopyButton(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`font-semibold text-sm ${isUserMessage ? 'text-blue-700' : 'text-gray-700'}`}>
            {isUserMessage ? 'User' : 'Assistant'}
          </span>
          <time
            className="text-xs text-gray-500"
            dateTime={message.timestamp}
            title={formatFullTimestamp(message.timestamp)}
          >
            {formatTimestamp(message.timestamp)}
          </time>
        </div>

        {/* Copy button - only for assistant messages */}
        {!isUserMessage && showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy message"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Message content */}
      <div className="prose prose-sm max-w-none">
        {isUserMessage ? (
          <div className="text-gray-800 whitespace-pre-wrap">{message.content}</div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ node, ...props }) => (
                <pre
                  {...props}
                  data-language={
                    node?.children?.[0]?.type === 'element' &&
                    node.children[0].tagName === 'code' &&
                    'className' in node.children[0].properties
                      ? String(node.children[0].properties.className)
                          .replace('language-', '')
                      : undefined
                  }
                  className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto"
                />
              ),
              code: ({ node, inline, ...props }) =>
                inline ? (
                  <code {...props} className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm" />
                ) : (
                  <code {...props} />
                ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>

      {/* Metadata */}
      {message.metadata && Object.keys(message.metadata).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs text-gray-500">
            {message.metadata.model && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Model:</span>
                <span>{String(message.metadata.model)}</span>
              </span>
            )}
            {message.metadata.tokenCount && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Tokens:</span>
                <span>{String(message.metadata.tokenCount)} tokens</span>
              </span>
            )}
            {message.metadata.processingTime && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Time:</span>
                <span>
                  {(Number(message.metadata.processingTime) / 1000).toFixed(2)}s
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
