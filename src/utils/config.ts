import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  TOKEN: process.env.TOKEN,
};

// use joi to validate the config
const schema = Joi.object({
  TOKEN: Joi.string().required(),
});

const { error } = schema.validate(config);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default config;
