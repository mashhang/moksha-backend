import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth";
import session from "express-session";
import passport from "passport";
import oauthRoutes from "./src/routes/oauth";
import userRoutes from "./src/routes/user";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Initialize Passport strategies
app.use("/api/auth", authRoutes); // email/password
app.use("/api/oauth", oauthRoutes); // google/facebook
app.use("/api/user", userRoutes); // user profile updates

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
