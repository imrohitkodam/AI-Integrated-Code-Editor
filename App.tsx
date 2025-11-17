
import React, { useState, useCallback, useEffect } from 'react';
import FileTree from './components/FileTree';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import { FILE_SYSTEM_DATA, ICONS } from './constants';
import type { FileSystemItem, Message, AiFix, FileToFix } from './types';
import { getAiCodeFix } from './services/geminiService';

const App: React.FC = () => {
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>(FILE_SYSTEM_DATA);
  const [openTabs, setOpenTabs] = useState<{ path: string; content: string }[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
      { sender: 'system', text: "Welcome to AI Code Pilot! Type `@codebase` to index your project and then describe an error to get an automated fix." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexed, setIsIndexed] = useState(false);

  useEffect(() => {
    // Open a file by default to demonstrate functionality
    const defaultFilePath = 'src/components/UserProfile.tsx';
    const defaultFile = findFile(defaultFilePath, fileSystem);
    if(defaultFile) {
        handleFileSelect(defaultFilePath, defaultFile.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findFile = (path: string, items: FileSystemItem[]): { content: string } | null => {
    const pathParts = path.split('/');
    let currentItems = items;
    for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const item = currentItems.find(it => it.name === part);
        if (!item) return null;
        if (item.type === 'file' && i === pathParts.length - 1) {
            return { content: item.content };
        }
        if (item.type === 'directory') {
            currentItems = item.children;
        } else {
            return null;
        }
    }
    return null;
  };

  const updateFileContentInTree = (path: string, newContent: string, items: FileSystemItem[]): FileSystemItem[] => {
    return items.map(item => {
        const currentPath = item.name;
        if(path.startsWith(currentPath)) {
            if(item.type === 'file' && path === currentPath) {
                return { ...item, content: newContent };
            }
            if(item.type === 'directory') {
                const remainingPath = path.substring(currentPath.length + 1);
                return { ...item, children: updateFileContentInTree(remainingPath, newContent, item.children) };
            }
        }
        return item;
    });
  };

  const handleFileSelect = useCallback((path: string, content: string) => {
    if (!openTabs.some(tab => tab.path === path)) {
      setOpenTabs(prev => [...prev, { path, content }]);
    }
    setActiveTab(path);
  }, [openTabs]);

  const handleTabClick = useCallback((path: string) => {
    setActiveTab(path);
  }, []);

  const handleTabClose = useCallback((path: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.path !== path));
    if (activeTab === path) {
      const newActiveIndex = openTabs.findIndex(tab => tab.path === path) - 1;
      setActiveTab(openTabs[newActiveIndex] ? openTabs[newActiveIndex].path : openTabs.length > 1 ? openTabs[0].path : null);
    }
  }, [activeTab, openTabs]);

  const handleContentChange = useCallback((path: string, newContent: string) => {
    setOpenTabs(prev => prev.map(tab => tab.path === path ? { ...tab, content: newContent } : tab));
    setFileSystem(prev => updateFileContentInTree(path, newContent, prev));
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    const userMessage: Message = { sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    
    if (text.trim() === '@codebase') {
        setIsIndexed(true);
        setMessages(prev => [...prev, { sender: 'system', text: 'Codebase indexed successfully! Please provide an error message or issue description.' }]);
        return;
    }

    if (!isIndexed) {
        setMessages(prev => [...prev, { sender: 'system', text: "Please index the codebase first by typing `@codebase`." }]);
        return;
    }

    setIsLoading(true);
    try {
        const fix = await getAiCodeFix(text, fileSystem);
        const aiMessage: Message = { 
            sender: 'ai', 
            text: `I've analyzed the error and found a potential solution.\n\nHere is the explanation:`, 
            fix 
        };
        setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setMessages(prev => [...prev, { sender: 'ai', text: `Sorry, I ran into an issue: ${errorMessage}` }]);
    } finally {
        setIsLoading(false);
    }
  }, [isIndexed, fileSystem]);
  
  const handleApplyFix = useCallback((fix: AiFix) => {
    let newFileSystem = [...fileSystem];
    let newOpenTabs = [...openTabs];

    fix.filesToFix.forEach((fileToFix: FileToFix) => {
      newFileSystem = updateFileContentInTree(fileToFix.filePath, fileToFix.newContent, newFileSystem);
      
      const tabIndex = newOpenTabs.findIndex(tab => tab.path === fileToFix.filePath);
      if (tabIndex > -1) {
        newOpenTabs[tabIndex] = { ...newOpenTabs[tabIndex], content: fileToFix.newContent };
      }
    });

    setFileSystem(newFileSystem);
    setOpenTabs(newOpenTabs);

    setMessages(prev => [...prev, { sender: 'system', text: `Fix applied successfully to ${fix.filesToFix.length} file(s).` }]);
  }, [fileSystem, openTabs]);

  return (
    <div className="flex h-screen w-screen font-sans">
      <div className="w-1/6 bg-sidebar-bg p-4 overflow-y-auto min-w-[200px]">
        <h2 className="text-lg font-bold mb-4">Explorer</h2>
        <FileTree items={fileSystem} onFileSelect={handleFileSelect} />
      </div>
      <div className="w-3/6 flex-grow">
        <Editor 
            openTabs={openTabs}
            activeTab={activeTab}
            onTabClick={handleTabClick}
            onTabClose={handleTabClose}
            onContentChange={handleContentChange}
        />
      </div>
      <div className="w-2/6 min-w-[350px]">
        <Terminal 
            messages={messages}
            onSendMessage={handleSendMessage}
            onApplyFix={handleApplyFix}
            isLoading={isLoading}
            isIndexed={isIndexed}
        />
      </div>
    </div>
  );
};

export default App;
