
import { GoogleGenAI, Type } from "@google/genai";
import type { File, Directory, FileSystemItem, AiFix } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

function flattenFileSystem(items: FileSystemItem[], path = ''): { path: string, content: string }[] {
    let files: { path: string, content: string }[] = [];
    for (const item of items) {
        const currentPath = path ? `${path}/${item.name}` : item.name;
        if (item.type === 'file') {
            files.push({ path: currentPath, content: item.content });
        } else {
            files = files.concat(flattenFileSystem(item.children, currentPath));
        }
    }
    return files;
}

function buildCodebaseContext(fileSystem: FileSystemItem[]): string {
    const flattenedFiles = flattenFileSystem(fileSystem);
    return flattenedFiles.map(file => `
// File: ${file.path}
${file.content}
    `).join('\n---\n');
}

export const getAiCodeFix = async (errorMessage: string, fileSystem: FileSystemItem[]): Promise<AiFix> => {
    try {
        const codebaseContext = buildCodebaseContext(fileSystem);

        const prompt = `
You are an expert AI programming assistant that can debug and fix code.
The user encountered the following error:

--- START ERROR ---
${errorMessage}
--- END ERROR ---

Analyze this error in the context of the following codebase:

--- START CODEBASE ---
${codebaseContext}
--- END CODEBASE ---

Your task is to provide a fix. Respond ONLY with a single, valid JSON object that adheres to the provided schema. Do not include any other text, explanations, or markdown formatting like \`\`\`json. Your entire response must be the JSON object itself.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: {
                            type: Type.STRING,
                            description: "A clear, concise explanation of the root cause of the error and how the fix addresses it.",
                        },
                        filesToFix: {
                            type: Type.ARRAY,
                            description: "A list of files that need to be modified to fix the issue.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    filePath: {
                                        type: Type.STRING,
                                        description: "The full path of the file to modify (e.g., 'src/App.tsx')."
                                    },
                                    newContent: {
                                        type: Type.STRING,
                                        description: "The entire, complete, new content of the file. Do not provide only a diff or snippet."
                                    }
                                },
                                required: ["filePath", "newContent"]
                            }
                        }
                    },
                    required: ["explanation", "filesToFix"]
                }
            }
        });

        const jsonString = response.text;
        const parsedResponse = JSON.parse(jsonString);

        if (!parsedResponse.explanation || !Array.isArray(parsedResponse.filesToFix)) {
             throw new Error("Invalid AI response format.");
        }

        return parsedResponse;
    } catch (error) {
        console.error("Error getting AI code fix:", error);
        throw new Error("Failed to get code fix from AI. Please check the console for details.");
    }
};
