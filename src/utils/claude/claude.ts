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
            text: `You are given the following key letters: "${keyLetters}". Your task is to generate exactly ${mnemonicCount} mnemonic sentences that are categorized as "${mnemonicType}". Each mnemonic sentence must directly correspond to the key letters provided, ensuring that the sentences are memorable, simple, and relevant. The mnemonic sentences should not include additional words or concepts that are not derived from the key letters. Do not number the sentences, and avoid adding any extra commentary or explanation.`,
          },
        ],
      },
    ],
  });

  return (msg.content[0] as any).text;
};
