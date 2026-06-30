import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AlignME API',
      version: '1.0.0',
      description: 'API documentation for the AlignME application. This documentation provides details about the available endpoints, their parameters, and expected responses. It is designed to help developers understand and interact with the AlignME API effectively.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: [path.join(__dirname, './routes/*.js'), path.join(__dirname, 'server.js')], // files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
