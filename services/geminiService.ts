import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

const apiKey = process.env.API_KEY;

if (!apiKey) {
    throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

const questionSchema = {
    type: Type.OBJECT,
    properties: {
        question: {
            type: Type.STRING,
            description: "The math question text."
        },
        options: {
            type: Type.ARRAY,
            description: "An array of 4 multiple-choice options.",
            items: {
                type: Type.STRING
            }
        },
        correctAnswerIndex: {
            type: Type.INTEGER,
            description: "The 0-based index of the correct answer in the options array."
        }
    },
    required: ["question", "options", "correctAnswerIndex"]
};


export const generateQuestion = async (difficulty: 'easy' | 'medium' | 'hard', history: string[]): Promise<Question> => {
    let prompt = `Generate one multiple-choice math question of ${difficulty} difficulty appropriate for a GED test. Topics can include basic arithmetic, algebra, geometry, and data analysis. Ensure there are exactly 4 options.`;

    if (history && history.length > 0) {
        const historyString = history.map(q => `- "${q}"`).join('\n');
        prompt += `

IMPORTANT: To avoid repetition, please generate a question that is different from these recently asked questions:
${historyString}`;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: questionSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedQuestion = JSON.parse(jsonString) as Question;
        
        // Basic validation
        if (
            !parsedQuestion.question || 
            !Array.isArray(parsedQuestion.options) || 
            parsedQuestion.options.length !== 4 || 
            typeof parsedQuestion.correctAnswerIndex !== 'number'
        ) {
            throw new Error("Received malformed question data from API.");
        }
        
        return parsedQuestion;
    } catch (error) {
        console.error("Error generating question:", error);
        throw new Error("Failed to generate a new question. Please try again.");
    }
};

export const generateExplanation = async (question: Question, incorrectAnswer?: string): Promise<string> => {
    const { question: questionText, options, correctAnswerIndex } = question;
    const correctAnswer = options[correctAnswerIndex];

    const studentActionPrompt = incorrectAnswer
        ? `The student incorrectly chose: "${incorrectAnswer}"`
        : "The student ran out of time and did not select an answer.";

    const prompt = `
        A student is preparing for the GED math test. Please provide a step-by-step explanation for the following problem.

        Problem: "${questionText}"

        The multiple-choice options were:
        ${options.map((opt, i) => `- ${opt}`).join('\n')}

        ${studentActionPrompt}
        The correct answer is: "${correctAnswer}"

        Explain clearly how to arrive at the correct answer. Break down the reasoning into simple steps. Be encouraging.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating explanation:", error);
        throw new Error("Failed to generate an explanation. Please try again.");
    }
};