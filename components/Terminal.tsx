
import React, { useState, useRef, useEffect } from 'react';
import type { Message, AiFix } from '../types';
import { ICONS } from '../constants';
import Icon from './Icon';

interface TerminalProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onApplyFix: (fix: AiFix) => void;
  isLoading: boolean;
  isIndexed: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ messages, onSendMessage, onApplyFix, isLoading, isIndexed }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };
  
  const renderMessageContent = (message: Message) => {
      const parts = message.text.split(/(`[^`]+`)/g);
      return parts.map((part, index) => {
          if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={index} className="bg-editor-bg text-primary-accent px-1 rounded text-sm">{part.slice(1, -1)}</code>;
          }
          return <span key={index}>{part}</span>
      });
  }

  return (
    <div className="flex flex-col h-full bg-terminal-bg border-l border-border-color">
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-4">
            <div className="flex items-start">
              <div className="mr-3 mt-1">
                {msg.sender === 'ai' ? <Icon>{ICONS.AI}</Icon> : <Icon>{ICONS.USER}</Icon>}
              </div>
              <div className="flex-1">
                <p className="font-bold capitalize">{msg.sender}</p>
                <div className="text-text-primary whitespace-pre-wrap">{renderMessageContent(msg)}</div>
                {msg.fix && (
                  <div className="mt-3 p-3 bg-editor-bg border border-border-color rounded-lg">
                    <h4 className="font-bold text-primary-accent">Fix Suggestion</h4>
                    <p className="text-sm mt-1 mb-3">{msg.fix.explanation}</p>
                    <button 
                      onClick={() => onApplyFix(msg.fix!)}
                      className="w-full bg-primary-accent text-white py-2 rounded hover:bg-opacity-80 transition-colors"
                    >
                      Apply Fix for {msg.fix.filesToFix.length} file(s)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
         {isLoading && (
            <div className="flex items-start">
              <div className="mr-3 mt-1"><Icon>{ICONS.AI}</Icon></div>
              <div className="animate-pulse">Thinking...</div>
            </div>
          )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border-color">
        <form onSubmit={handleSubmit} className="flex items-center bg-editor-bg rounded-lg p-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isIndexed ? "Describe the error or ask a question..." : "Type '@codebase' to index files"}
            className="flex-grow bg-transparent focus:outline-none px-2"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} className="p-2 text-primary-accent disabled:text-text-secondary">
            <Icon>{ICONS.SEND}</Icon>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Terminal;
