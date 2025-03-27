import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

// Load environment variables from the .env file in the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  TOKEN: process.env.TOKEN || '',
  CLIENT_ID: process.env.CLIENT_ID || '',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// use joi to validate the config
const schema = Joi.object({
  TOKEN: Joi.string().required(),
  CLIENT_ID: Joi.string().required(),
  NODE_ENV: Joi.string().valid('development', 'production').required()
});

const { error } = schema.validate(config);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default config;
