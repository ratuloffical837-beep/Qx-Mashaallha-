import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('Deriv High-Precision Engine is Online...'));

app.listen(PORT, () => console.log(`🚀 Master Backend on port ${PORT}`));
