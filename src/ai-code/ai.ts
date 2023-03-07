import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

export const MAX_INPUT_FILES = 5;
export const MAX_FILE_LENGTH_CHARACTERS = 10000;

const openAIConfiguration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(openAIConfiguration);

export { openai };
