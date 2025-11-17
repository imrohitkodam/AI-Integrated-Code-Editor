
import React, { useState } from 'react';
import type { Directory, FileSystemItem } from '../types';
import { ICONS } from '../constants';
import Icon from './Icon';

interface FileTreeProps {
  items: FileSystemItem[];
  onFileSelect: (path: string, content: string) => void;
  basePath?: string;
}

const FileTree: React.FC<FileTreeProps> = ({ items, onFileSelect, basePath = '' }) => {
  return (
    <div className="text-text-primary text-sm">
      <ul>
        {items.map((item) => (
          <li key={item.name}>
            <Node item={item} onFileSelect={onFileSelect} path={basePath} />
          </li>
        ))}
      </ul>
    </div>
  );
};

interface NodeProps {
    item: FileSystemItem;
    onFileSelect: (path: string, content: string) => void;
    path: string;
}

const Node: React.FC<NodeProps> = ({ item, onFileSelect, path }) => {
  const [isOpen, setIsOpen] = useState(true);
  const currentPath = path ? `${path}/${item.name}` : item.name;

  if (item.type === 'directory') {
    return (
      <div>
        <div 
          className="flex items-center cursor-pointer p-1 hover:bg-white/10 rounded"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Icon>{isOpen ? ICONS.DIRECTORY_OPEN : ICONS.DIRECTORY_CLOSED}</Icon>
          <span>{item.name}</span>
        </div>
        {isOpen && (
          <div className="ml-4 border-l border-border-color pl-2">
            <FileTree items={item.children} onFileSelect={onFileSelect} basePath={currentPath} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="flex items-center cursor-pointer p-1 hover:bg-white/10 rounded"
      onClick={() => onFileSelect(currentPath, item.content)}
    >
       <Icon>{ICONS.FILE}</Icon>
       <span>{item.name}</span>
    </div>
  );
};

export default FileTree;
