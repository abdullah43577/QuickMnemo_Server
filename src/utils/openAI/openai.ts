import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
const { OPENAI_API_KEY } = process.env;

interface GeneratePrompt {
  resumeTxt: string;
  bio: string;
  skills: string;
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const generateAssessment = async ({ resumeTxt, bio, skills }: GeneratePrompt) => {
  const messages = [
    { role: 'system', content: 'You are an AI that generates tailored assessment questions.' },
    {
      role: 'user',
      content: `Based on the following information: Resume: ${resumeTxt}, Bio: ${bio}, Skills: ${skills}. Generate 20 multiple choice questions for a skill assessment, ranging from very easy to hard. For each question, indicate the correct answer.`,
    },
  ] as ChatCompletionMessageParam[];

  const completion = await openai.chat.completions.create({
    messages,
    model: 'gpt-3.5-turbo',
  });

  console.log(completion.choices[0]);
};

// generatePrompt();
