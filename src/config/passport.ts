import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:4000/api/oauth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;

      if (!email) return done(null, false);

      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Create user
        user = await prisma.user.create({
          data: {
            email,
            name,
            password: "", // placeholder
            userDetails: {
              create: {
                name: name || "Unnamed User", // also saves to userDetails
              },
            },
          },
          include: {
            userDetails: true,
          },
        });
      } else {
        // If user exists but no details yet, create them
        const details = await prisma.userDetails.findUnique({
          where: { userId: user.id },
        });

        if (!details) {
          await prisma.userDetails.create({
            data: {
              userId: user.id,
              name: name || "Unnamed User",
            },
          });
        }
      }

      return done(null, user);
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      callbackURL: "http://localhost:4000/api/oauth/facebook/callback",
      profileFields: ["id", "emails", "name", "displayName"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;

      if (!email) return done(null, false);

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: profile.displayName,
            password: "oauth", // placeholder
          },
        });
      }
      done(null, user);
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: number, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});
