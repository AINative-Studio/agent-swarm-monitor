'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { Loader2 } from 'lucide-react';

export interface StreamingMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  streamingState?: 'idle' | 'streaming' | 'complete' | 'error';
  animationType?: 'none' | 'fade' | 'typewriter' | 'smooth';
  animationSpeed?: number;
  enableMarkdown?: boolean;
  codeTheme?: 'dark' | 'light' | 'vs-dark' | 'github' | 'monokai' | 'nord' | 'dracula';
  showStreamingIndicator?: boolean;
  className?: string;
  style?: React.CSSProperties;
  avatar?: React.ReactNode | string;
  displayName?: string;
  showTimestamp?: boolean;
  metadata?: {
    timestamp?: number;
    model?: string;
    tokensUsed?: number;
  };
  onStreamingComplete?: () => void;
  onContentUpdate?: (content: string) => void;
  onError?: (error: Error) => void;
  enableCodeCopy?: boolean;
  roleColors?: {
    user?: string;
    assistant?: string;
    system?: string;
  };
  testId?: string;
}

/**
 * StreamingMessage - Displays AI messages with streaming support, animations, and markdown rendering
 */
export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  role,
  content,
  streamingState = 'idle',
  animationType = 'smooth',
  animationSpeed = 30,
  enableMarkdown = true,
  codeTheme = 'dark',
  showStreamingIndicator = true,
  className = '',
  style,
  avatar,
  displayName,
  showTimestamp = false,
  metadata,
  onStreamingComplete,
  onContentUpdate,
  onError,
  enableCodeCopy = true,
  roleColors,
  testId = 'streaming-message',
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const previousContentRef = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Default role colors
  const defaultRoleColors = {
    user: '#3b82f6',
    assistant: '#10b981',
    system: '#f59e0b',
  };

  const mergedRoleColors = { ...defaultRoleColors, ...roleColors };

  // Handle typewriter animation
  useEffect(() => {
    if (animationType === 'none' || animationType === 'fade') {
      setDisplayedContent(content);
      previousContentRef.current = content;
      return;
    }

    if (animationType === 'typewriter' || animationType === 'smooth') {
      const previousContent = previousContentRef.current;
      const newChars = content.slice(previousContent.length);

      if (newChars.length > 0) {
        setIsAnimating(true);
        let currentIndex = 0;

        const animateChar = () => {
          if (currentIndex < newChars.length) {
            setDisplayedContent(previousContent + newChars.slice(0, currentIndex + 1));
            currentIndex++;
            timeoutRef.current = setTimeout(animateChar, animationSpeed);
          } else {
            setIsAnimating(false);
            previousContentRef.current = content;
            if (onContentUpdate) {
              onContentUpdate(content);
            }
          }
        };

        animateChar();
      } else if (content.length < previousContent.length) {
        // Handle content reduction (e.g., deletion)
        setDisplayedContent(content);
        previousContentRef.current = content;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, animationType, animationSpeed, onContentUpdate]);

  // Handle streaming completion
  useEffect(() => {
    if (streamingState === 'complete' && previousContentRef.current === content) {
      if (onStreamingComplete) {
        onStreamingComplete();
      }
    }
  }, [streamingState, content, onStreamingComplete]);

  // Handle errors
  useEffect(() => {
    if (streamingState === 'error' && onError) {
      onError(new Error('Streaming error occurred'));
    }
  }, [streamingState, onError]);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (streamingState === 'streaming' && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [displayedContent, streamingState]);

  const isStreaming = streamingState === 'streaming' || isAnimating;

  // Render avatar
  const renderAvatar = () => {
    if (!avatar) return null;

    if (typeof avatar === 'string') {
      return (
        <img
          src={avatar}
          alt={`${displayName || role} avatar`}
          className="message-avatar"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      );
    }

    return <div className="message-avatar">{avatar}</div>;
  };

  // Render timestamp
  const renderTimestamp = () => {
    if (!showTimestamp || !metadata?.timestamp) return null;

    const time = new Date(metadata.timestamp).toLocaleTimeString();
    return (
      <span className="message-timestamp" style={{ fontSize: '12px', opacity: 0.6 }}>
        {time}
      </span>
    );
  };

  // Custom components for markdown rendering
  const markdownComponents = useMemo(
    () => ({
      code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        const codeString = String(children).replace(/\n$/, '');

        if (!inline && language) {
          return (
            <CodeBlock
              language={language}
              theme={codeTheme}
              enableCopy={enableCodeCopy}
              showLineNumbers={true}
            >
              {codeString}
            </CodeBlock>
          );
        }

        return (
          <code
            className={className}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            }}
            {...props}
          >
            {children}
          </code>
        );
      },
    }),
    [codeTheme, enableCodeCopy]
  );

  const roleColor = mergedRoleColors[role];

  return (
    <div
      ref={containerRef}
      className={`streaming-message streaming-message-${role} ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        marginBottom: '16px',
        borderRadius: '8px',
        backgroundColor: role === 'user' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)',
        borderLeft: `4px solid ${roleColor}`,
        transition: 'all 0.3s ease',
        ...style,
      }}
      data-testid={testId}
      data-role={role}
      data-streaming-state={streamingState}
    >
      <style jsx>{`
        .streaming-message {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
        }

        .streaming-message-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .message-display-name {
          font-weight: 600;
          font-size: 14px;
        }

        .message-content {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .streaming-message.fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .message-content :global(p) {
          margin: 0.5rem 0;
        }

        .message-content :global(p:first-child) {
          margin-top: 0;
        }

        .message-content :global(p:last-child) {
          margin-bottom: 0;
        }

        .message-content :global(h1),
        .message-content :global(h2),
        .message-content :global(h3),
        .message-content :global(h4),
        .message-content :global(h5),
        .message-content :global(h6) {
          margin: 1.5rem 0 0.5rem 0;
          font-weight: 600;
          line-height: 1.3;
        }

        .message-content :global(h1) {
          font-size: 2rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .message-content :global(h2) {
          font-size: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.3rem;
        }

        .message-content :global(h3) {
          font-size: 1.25rem;
        }

        .message-content :global(ul),
        .message-content :global(ol) {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .message-content :global(li) {
          margin: 0.25rem 0;
        }

        .message-content :global(blockquote) {
          margin: 1rem 0;
          padding-left: 1rem;
          border-left: 3px solid rgba(0, 0, 0, 0.2);
          color: rgba(0, 0, 0, 0.7);
        }

        .message-content :global(table) {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }

        .message-content :global(th),
        .message-content :global(td) {
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 8px 12px;
          text-align: left;
        }

        .message-content :global(th) {
          background-color: rgba(0, 0, 0, 0.05);
          font-weight: 600;
        }

        .message-content :global(a) {
          color: ${roleColor};
          text-decoration: none;
        }

        .message-content :global(a:hover) {
          text-decoration: underline;
        }

        .message-metadata {
          display: flex;
          gap: 12px;
          font-size: 12px;
          opacity: 0.6;
          margin-top: 4px;
        }
      `}</style>

      {/* Header with avatar and display name */}
      <div className="streaming-message-header">
        {renderAvatar()}
        {displayName && (
          <span className="message-display-name" style={{ color: roleColor }}>
            {displayName}
          </span>
        )}
        {!displayName && (
          <span className="message-display-name" style={{ color: roleColor }}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        )}
        {renderTimestamp()}
      </div>

      {/* Message content */}
      <div className="message-content" data-testid="message-content">
        {enableMarkdown ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {displayedContent}
          </ReactMarkdown>
        ) : (
          <div style={{ whiteSpace: 'pre-wrap' }}>{displayedContent}</div>
        )}
      </div>

      {/* Streaming indicator */}
      {isStreaming && showStreamingIndicator && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-xs text-gray-500">Streaming...</span>
        </div>
      )}

      {/* Error state */}
      {streamingState === 'error' && (
        <div
          style={{
            color: '#dc2626',
            fontSize: '14px',
            padding: '8px',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderRadius: '4px',
          }}
          role="alert"
        >
          An error occurred during streaming
        </div>
      )}

      {/* Metadata */}
      {metadata && (metadata.model || metadata.tokensUsed) && (
        <div className="message-metadata">
          {metadata.model && <span>Model: {metadata.model}</span>}
          {metadata.tokensUsed && <span>Tokens: {metadata.tokensUsed}</span>}
        </div>
      )}
    </div>
  );
};

export default StreamingMessage;
