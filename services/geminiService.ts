import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

// Per coding guidelines, the API key is sourced directly from environment variables.
console.log('API Key length:', process.env.API_KEY?.length);
console.log('API Key starts with:', process.env.API_KEY?.substring(0, 10));
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export interface FilePayload {
    mimeType: string;
    data: string; // base64 encoded string
}

const quizQuestionSchema = {
    type: Type.OBJECT,
    properties: {
        question: {
            type: Type.STRING,
            description: "The question text."
        },
        options: {
            type: Type.ARRAY,
            description: "A list of 4 answer options, each prefixed with 'A.', 'B.', 'C.', or 'D.'.",
            items: {
                type: Type.STRING
            }
        },
        answer: {
            type: Type.STRING,
            description: "The correct answer letter (e.g., 'A', 'B', 'C', or 'D')."
        },
        difficulty: {
            type: Type.STRING,
            description: "The difficulty of the question, which must be one of: 'Easy', 'Medium', or 'Hard'."
        }
    },
    required: ["question", "options", "answer", "difficulty"]
};

export const generateQuizQuestions = async (
  topicOrFile: string | FilePayload,
  numQuestions: number,
): Promise<Omit<Question, 'marks'>[]> => {
  try {
    let contents: any;

    if (typeof topicOrFile === 'string') {
        const prompt = `Generate ${numQuestions} multiple-choice questions on the topic "${topicOrFile}". The questions should have a mix of difficulty levels: Easy, Medium, and Hard.`;
        contents = prompt;
    } else {
        const { mimeType, data } = topicOrFile;

        // Handle Text files by decoding and embedding as text
        if (mimeType.startsWith('text/')) {
             // Decode base64 string to text using TextDecoder to handle UTF-8 correctly
             const binaryString = atob(data);
             const bytes = new Uint8Array(binaryString.length);
             for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
             }
             const decodedText = new TextDecoder().decode(bytes);

             const textPart = {
                text: `Generate ${numQuestions} multiple-choice questions based on the following content:\n\n${decodedText}\n\nThe questions should have a mix of difficulty levels: Easy, Medium, and Hard.`
            };
            contents = { parts: [textPart] };
        } 
        // Handle PDF/Images via inlineData
        else if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
            const filePart = {
                inlineData: {
                    mimeType: mimeType,
                    data: data,
                },
            };
            const textPart = {
                text: `Generate ${numQuestions} multiple-choice questions based on the content of the attached file. The questions should have a mix of difficulty levels: Easy, Medium, and Hard.`
            };
            contents = { parts: [textPart, filePart] };
        } else {
             throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF, Text file, or Image.`);
        }
    }
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: quizQuestionSchema
            },
            // System instruction to ensure high quality role-playing
            systemInstruction: "You are an expert educational quiz creator. Your goal is to create highly accurate, relevant, and challenging multiple-choice questions based strictly on the provided material or topic. Ensure distractor options are plausible but incorrect."
        }
    });

    const jsonString = response.text.trim();
    const questions = JSON.parse(jsonString);

    // Basic validation
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Generated content is not a valid quiz array.");
    }
    
    return questions.map(q => ({
      ...q,
      answer: q.answer.trim().replace('.', '')
    }));

  } catch (error: any) {
    console.error("Detailed Gemini API Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Try to extract a more user-friendly error message
    const errorMessage = error.message || "Unknown error occurred";
    
    // Show the actual error message for debugging
    throw new Error(`Gemini API Error: ${errorMessage}`);
  }
};