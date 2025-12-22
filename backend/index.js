import 'dotenv/config';
import express from 'express';
import v1Routes from './routes/app.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());


app.use('/v1', v1Routes);


const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

export default server;