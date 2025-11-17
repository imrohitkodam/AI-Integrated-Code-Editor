
import React from 'react';

interface EditorProps {
  openTabs: { path: string; content: string }[];
  activeTab: string | null;
  onTabClick: (path: string) => void;
  onTabClose: (path: string) => void;
  onContentChange: (path: string, newContent: string) => void;
}

const Editor: React.FC<EditorProps> = ({
  openTabs,
  activeTab,
  onTabClick,
  onTabClose,
  onContentChange,
}) => {
  const activeFile = openTabs.find(tab => tab.path === activeTab);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeTab) {
        onContentChange(activeTab, e.target.value);
    }
  };

  return (
    <div className="flex flex-col h-full bg-editor-bg">
      <div className="flex bg-sidebar-bg border-b border-border-color">
        {openTabs.map(tab => (
          <div
            key={tab.path}
            className={`flex items-center justify-between p-2 text-sm cursor-pointer border-r border-border-color ${
              activeTab === tab.path ? 'bg-editor-bg text-white' : 'bg-sidebar-bg text-text-secondary'
            }`}
            onClick={() => onTabClick(tab.path)}
          >
            <span className="mr-2">{tab.path.split('/').pop()}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.path);
              }}
              className="text-text-secondary hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
            >
              x
            </button>
          </div>
        ))}
      </div>
      <div className="flex-grow p-1">
        {activeFile ? (
          <textarea
            value={activeFile.content}
            onChange={handleContentChange}
            className="w-full h-full bg-transparent text-text-primary font-mono text-sm resize-none focus:outline-none"
            spellCheck="false"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-secondary">
            Select a file to begin editing.
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
