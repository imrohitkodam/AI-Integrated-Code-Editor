
export interface File {
  type: 'file';
  name: string;
  content: string;
}

export interface Directory {
  type: 'directory';
  name:string;
  children: FileSystemItem[];
}

export type FileSystemItem = File | Directory;

export interface Message {
  sender: 'user' | 'ai' | 'system';
  text: string;
  fix?: AiFix | null;
}

export interface FileToFix {
  filePath: string;
  newContent: string;
}

export interface AiFix {
  explanation: string;
  filesToFix: FileToFix[];
}
