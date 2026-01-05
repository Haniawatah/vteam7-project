import 'dotenv/config';
import express from 'express';
import v1Routes from './routes/app.js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const server = express();
const port = process.env.PORT || 3000;

server.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-access-token'],
}));

server.use(express.json());


server.use('/v1', v1Routes);


const app = server.listen(port, () => console.log(`Example app listening on port ${port}!`));

export default app;