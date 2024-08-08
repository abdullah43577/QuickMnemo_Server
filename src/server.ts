import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { router } from './routes/router';
import { connectDB } from './utils/connectDB';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { passportSetup } from './utils/Google/passportSetup';
import { Request, Response } from 'express';

const { PORT, SESSION_SECRET } = process.env;
const app = express();

//* Middlewares
app.use(morgan('dev'));
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
app.use(
  session({
    secret: SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);
app.use(passport.initialize());
app.use(passport.session());
passportSetup();

app.listen(PORT, async () => {
  // connect to database
  await connectDB();
  console.log(`server started on http://localhost:${PORT}`);
});

// routes
app.use('/auth', router);
// routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist!',
    explorableSolutions: {
      solution1: 'ensure the "METHOD" used to call the endpoint is correct!',
      solution2: 'ensure the relative paths to the server url is defined correctly',
    },
  });
});
