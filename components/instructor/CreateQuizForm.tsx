import React, { useState } from 'react';
import { User, View, Question, NUM_QUESTIONS, TIMER_DURATIONS } from '../../types';
import * as geminiService from '../../services/geminiService';
import * as quizService from '../../services/quizService';
import Spinner from '../shared/Spinner';
import Modal from '../shared/Modal';
// @ts-ignore - these are loaded via importmap
import mammoth from 'mammoth';
// @ts-ignore
import JSZip from 'jszip';

interface CreateQuizFormProps {
  currentUser: User;
  navigateTo: (view: View) => void;
}

const CreateQuizForm: React.FC<CreateQuizFormProps> = ({ currentUser, navigateTo }) => {
  const [generationMode, setGenerationMode] = useState<'topic' | 'file'>('topic');
  const [topic, setTopic] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(NUM_QUESTIONS[0]);
  const [totalMarks, setTotalMarks] = useState<number>(20);
  const [timer, setTimer] = useState<number>(TIMER_DURATIONS[9]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedQuizCode, setGeneratedQuizCode] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  const getMimeType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'txt': return 'text/plain';
      case 'md': return 'text/markdown';
      case 'csv': return 'text/csv';
      case 'json': return 'text/json';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      default: return 'application/octet-stream';
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Extra validation for file size if needed, e.g., 20MB max
        if (file.size > 20 * 1024 * 1024) {
            setError("File size exceeds 20MB limit.");
            setSelectedFile(null);
            return;
        }
        setSelectedFile(file);
        setError('');
    }
  };

  // Helper to extract text from DOCX using Mammoth
  const extractTextFromDocx = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (e: any) {
        console.error("DOCX extraction error", e);
        throw new Error("Failed to read Word document. Ensure it is a valid .docx file.");
    }
  };

  // Helper to extract text from PPTX using JSZip
  const extractTextFromPptx = async (file: File): Promise<string> => {
    try {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);
        
        // Find all slide XML files
        const slideFiles = Object.keys(content.files).filter(name => 
            name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
        );
        
        // Sort slides to attempt correct order
        slideFiles.sort((a: string, b: string) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
        });

        let fullText = "";
        for (const slide of slideFiles) {
            const xml = await content.files[slide].async("text");
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, "text/xml");
            
            // Extract text from <a:t> tags which contain text runs in PPTX
            const textNodes = xmlDoc.getElementsByTagName("a:t");
            let slideText = "";
            for (let i = 0; i < textNodes.length; i++) {
                slideText += textNodes[i].textContent + " ";
            }
            if (slideText.trim()) {
                 fullText += `[Slide Content]: ${slideText.trim()}\n`;
            }
        }
        
        if (!fullText) {
            throw new Error("No text found in slides.");
        }
        return fullText;
    } catch (e: any) {
        console.error("PPTX extraction error", e);
        throw new Error("Failed to read PowerPoint presentation. Ensure it is a valid .pptx file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generationMode === 'topic' && !topic.trim()) {
      setError("Please enter a quiz topic.");
      return;
    }
     if (generationMode === 'file' && !selectedFile) {
      setError("Please select a file to upload.");
      return;
    }
    if (totalMarks <= 0) {
      setError("Total marks must be a positive number.");
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      let generatedQuestions;
      if (generationMode === 'topic') {
          generatedQuestions = await geminiService.generateQuizQuestions(topic, numQuestions);
      } else if (selectedFile) {
          const extension = selectedFile.name.split('.').pop()?.toLowerCase();
          
          // Handle Modern Office Formats (Client-side extraction)
          if (extension === 'docx') {
              const extractedText = await extractTextFromDocx(selectedFile);
              // Send extracted text as a text/plain payload
              generatedQuestions = await geminiService.generateQuizQuestions({
                  mimeType: 'text/plain',
                  data: btoa(extractedText) // Encode extracted text to base64
              }, numQuestions);
          } 
          else if (extension === 'pptx') {
              const extractedText = await extractTextFromPptx(selectedFile);
              generatedQuestions = await geminiService.generateQuizQuestions({
                  mimeType: 'text/plain',
                  data: btoa(extractedText)
              }, numQuestions);
          }
          // Handle Legacy formats - not supported
          else if (extension === 'doc' || extension === 'ppt') {
              throw new Error(`Legacy .${extension} files are not supported. Please save your file as .${extension}x and try again.`);
          }
          // Handle Native Supported Formats (PDF, Images, TXT)
          else {
              const fileData = await fileToBase64(selectedFile);
              const mimeType = getMimeType(selectedFile.name);
              generatedQuestions = await geminiService.generateQuizQuestions({
                  mimeType,
                  data: fileData
              }, numQuestions);
          }
      } else {
          throw new Error("No generation source provided.");
      }


      // Mark allocation logic
      const difficultyWeights: { [key: string]: number } = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      let totalWeight = 0;
      generatedQuestions.forEach(q => {
          totalWeight += difficultyWeights[q.difficulty] || 1; // Default weight of 1 if difficulty is unknown
      });

      if (totalWeight === 0) {
        throw new Error("Could not calculate question weights. Please try generating the quiz again.");
      }
      
      const baseMark = totalMarks / totalWeight;

      const questionsWithMarks: Question[] = generatedQuestions.map(q => ({
          ...q,
          marks: parseFloat((baseMark * (difficultyWeights[q.difficulty] || 1)).toFixed(2))
      }));

      const finalTopic = generationMode === 'file' ? selectedFile?.name.split('.').slice(0, -1).join('.') || 'Uploaded Quiz' : topic;
      const newQuiz = await quizService.createQuiz(currentUser.id, finalTopic, 'Mixed', timer, questionsWithMarks, totalMarks);
      setGeneratedQuizCode(newQuiz.quizCode);
      setCopyButtonText('Copy'); // Reset button text on new quiz creation
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const closeModalAndNavigate = () => {
    setIsModalOpen(false);
    navigateTo(View.INSTRUCTOR_DASHBOARD);
  }

  const handleCopyCode = () => {
    if (!navigator.clipboard) {
        console.warn('Clipboard API not available.');
        return;
    }
    navigator.clipboard.writeText(generatedQuizCode).then(() => {
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Copy'), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner message="Processing your material and generating questions with AI..." />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
        <button onClick={() => navigateTo(View.INSTRUCTOR_DASHBOARD)} className="text-sm text-violet-600 dark:text-violet-400 hover:underline mb-4">&larr; Back to Dashboard</button>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Create a New Quiz</h2>
        <p className="text-sm text-gray-500 dark:text-violet-300 mb-6">Generate questions from a topic or upload your own course material.</p>
        
        <div role="tablist" aria-label="Quiz generation method" className="flex justify-center mb-6">
            <div className="bg-violet-100 dark:bg-violet-900 p-1 rounded-full">
                <button
                    role="tab"
                    aria-selected={generationMode === 'topic'}
                    onClick={() => { setGenerationMode('topic'); setSelectedFile(null); setError(''); }}
                    className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${generationMode === 'topic' ? 'bg-white dark:bg-gray-800 shadow text-violet-600' : 'text-gray-600 dark:text-violet-200'}`}
                >
                    From Topic
                </button>
                <button
                    role="tab"
                    aria-selected={generationMode === 'file'}
                    onClick={() => { setGenerationMode('file'); setTopic(''); setError(''); }}
                    className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${generationMode === 'file' ? 'bg-white dark:bg-gray-800 shadow text-violet-600' : 'text-gray-600 dark:text-violet-200'}`}
                >
                    From Material
                </button>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {generationMode === 'topic' ? (
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-violet-200">Quiz Topic</label>
              <input type="text" id="topic" value={topic} onChange={(e) => { setTopic(e.target.value); setError(''); }} required placeholder="e.g., Modern World History" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-violet-700 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500" />
            </div>
          ) : (
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-violet-200">Upload Material</label>
                <div className="mt-1">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 hover:bg-violet-50 dark:hover:bg-violet-900 border border-gray-300 dark:border-violet-700 rounded-md font-medium text-violet-600 px-4 py-2 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>{selectedFile ? 'Change file' : 'Select file'}</span>
                    <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        onChange={handleFileChange} 
                        accept=".pdf,.txt,.md,.csv,.jpg,.jpeg,.png,.docx,.pptx,.doc,.ppt" 
                    />
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-violet-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-medium truncate">{selectedFile.name}</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">Supported: PDF, Word (docx), PowerPoint (pptx), Text, CSV, Images. Max 20MB.</p>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 dark:text-violet-200">Number of Questions</label>
              <select id="numQuestions" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-violet-700 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500">
                {NUM_QUESTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700 dark:text-violet-200">Total Marks</label>
              <input type="number" id="totalMarks" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} min="1" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-violet-700 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500" />
            </div>
            <div>
              <label htmlFor="timer" className="block text-sm font-medium text-gray-700 dark:text-violet-200">Timer (Minutes)</label>
              <select id="timer" value={timer} onChange={(e) => setTimer(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-violet-700 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500">
                {TIMER_DURATIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          
          {error && <div role="alert" className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">{error}</div>}
          
          <div className="flex justify-end">
            <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Generate & Create Quiz'}
            </button>
          </div>
        </form>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModalAndNavigate} title="Quiz Created Successfully!">
        <div className="flex items-center bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-sm font-medium px-4 py-3 rounded-md mb-4" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your quiz has been generated and is ready to be shared.</span>
        </div>
        <p className="text-gray-600 dark:text-violet-300 mb-2">Share the following code with your students:</p>
        <div className="bg-violet-100 dark:bg-violet-900 rounded-lg flex items-center justify-between p-3 gap-4">
            <span className="text-3xl font-bold tracking-widest text-violet-600 dark:text-violet-400 font-mono select-all">
                {generatedQuizCode}
            </span>
            <button
                onClick={handleCopyCode}
                className="inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 focus:ring-offset-gray-800"
                style={{ minWidth: '95px' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>{copyButtonText}</span>
            </button>
        </div>
         <div className="mt-6 flex justify-end">
             <button onClick={closeModalAndNavigate} className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">Done</button>
         </div>
      </Modal>
    </>
  );
};

export default CreateQuizForm;