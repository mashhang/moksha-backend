// src/routes/auth.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router(); // ✅ this avoids type mismatch
const prisma = new PrismaClient();

router.post("/signup", (req: Request, res: Response) => {
  (async () => {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name },
      });
      res.status(201).json({ message: "Signup successful", user });
    } catch (err) {
      res.status(400).json({ error: "Email already in use" });
    }
  })();
});

router.post("/login", (req: Request, res: Response) => {
  (async () => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    res.status(200).json({ token, user });
  })();
});

export default router;
