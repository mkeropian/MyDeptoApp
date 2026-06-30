const { writeFileSync, mkdirSync } = require('fs');

require ( 'dotenv' ).config();

const targetPath = './src/environments/environment.ts';
const targetPathDev = './src/environments/environment.development.ts';

const maptilerKey = process.env['MAPTILER_KEY'];

if ( !maptilerKey) {
  throw new Error('MAPTILER_KEY is not set in .env file')
}

const envFileContent = `
export const environment = {
  MAPTILER_KEY: "${ maptilerKey }",
};
`

mkdirSync('./src/environments', { recursive: true });

writeFileSync(targetPath, envFileContent);
writeFileSync(targetPathDev, envFileContent);