import Anthropic from '@anthropic-ai/sdk';
const { CLAUDE_API_KEY } = process.env;

interface GeneratePrompt {
  keyLetters: string;
  mnemonicType: 'simple' | 'educative' | 'funny';
  mnemonicCount: number;
}

const anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY });

export const generateMnemonic = async function ({ keyLetters, mnemonicType, mnemonicCount }: GeneratePrompt): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1000,
    temperature: 0.7,
    system: 'You are an experienced professional creating customized and memorable mnemonics for technical concepts.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Based on the following data: ${keyLetters}, create exactly ${mnemonicCount} mnemonic sentences that are ${mnemonicType}. Each sentence should be short, easy to remember, and ensuring faster memory retention and relevance to the provided terms. Do not number the sentences, and do not include any additional explanation or commentary.`,
          },
        ],
      },
    ],
  });

  return (msg.content[0] as any).text;
};
