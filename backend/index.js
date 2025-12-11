import 'dotenv/config';
import express from 'express';
import v1Routes from './routes/app.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());


app.use('/v1', v1Routes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
