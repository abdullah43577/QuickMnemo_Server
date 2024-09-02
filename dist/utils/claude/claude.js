"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMnemonic = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const { CLAUDE_API_KEY } = process.env;
const anthropic = new sdk_1.default({ apiKey: CLAUDE_API_KEY });
const generateMnemonic = async function ({ keyLetters, mnemonicType, mnemonicCount }) {
    const msg = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        temperature: 0.1,
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
    return msg.content[0].text;
};
exports.generateMnemonic = generateMnemonic;
