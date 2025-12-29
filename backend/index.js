import 'dotenv/config';
import express from 'express';
import v1Routes from './routes/app.js';

import cors from 'cors';

const server = express();
const port = process.env.PORT || 3000;

server.use(cors());

server.use(express.json());


server.use('/v1', v1Routes);


const app = server.listen(port, () => console.log(`Example app listening on port ${port}!`));

export default app;