import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.get('/', (req, res) => res.send('Power AI V8 Online'));
app.listen(5000, () => console.log('Backend Ready'));
