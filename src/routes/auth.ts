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

router.get("/me", (req: Request, res: Response) => {
  (async () => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: number;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          userDetails: true, // 👈 this is required!
        },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      const { id, email, name, userDetails } = user;
      res.json({
        id,
        email,
        name: name || userDetails?.name || "",
        phone: userDetails?.phone || "",
        address: userDetails?.address || "",
      });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  })();
});

export default router;
