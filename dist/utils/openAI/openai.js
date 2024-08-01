"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAssessment = void 0;
const openai_1 = __importDefault(require("openai"));
const { OPENAI_API_KEY } = process.env;
const openai = new openai_1.default({
    apiKey: OPENAI_API_KEY,
});
const generateAssessment = async ({ resumeTxt, bio, skills }) => {
    const messages = [
        { role: 'system', content: 'You are an AI that generates tailored assessment questions.' },
        {
            role: 'user',
            content: `Based on the following information: Resume: ${resumeTxt}, Bio: ${bio}, Skills: ${skills}. Generate 20 multiple choice questions for a skill assessment, ranging from very easy to hard. For each question, indicate the correct answer.`,
        },
    ];
    const completion = await openai.chat.completions.create({
        messages,
        model: 'gpt-3.5-turbo',
    });
    console.log(completion.choices[0]);
};
exports.generateAssessment = generateAssessment;
// generatePrompt();
