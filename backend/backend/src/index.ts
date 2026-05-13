import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 5000;

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
