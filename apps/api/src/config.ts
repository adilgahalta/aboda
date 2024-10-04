import { config } from 'dotenv';
import { resolve } from 'path';

export const NODE_ENV = process.env.NODE_ENV || 'development';

const envFile = NODE_ENV === 'development' ? '.env.development' : '.env';

config({ path: resolve(__dirname, `../${envFile}`) });
config({ path: resolve(__dirname, `../${envFile}.local`), override: true });

// Load all environment variables from .env file

export const PORT = process.env.PORT || 8000;
export const DATABASE_URL = 'mysql://root:Raihanhykl123.@localhost:3306/aboda';
export const verify_email_secret = process.env.VERIFY_EMAIL_SECRET || 'secret';
export const JWT_SECRET = process.env.JWT_SECRET || 'secret';
