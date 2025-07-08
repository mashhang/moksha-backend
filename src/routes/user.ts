import express, { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../../middleware/authMiddleware";

const router = express.Router();
const prisma = new PrismaClient();

router.patch("/profile", authMiddleware, async (req: AuthRequest, res) => {
  const { name, phone, address } = req.body;
  const user = req.user;

  if (!user || typeof user.id !== "number") {
    res.status(401).json({ message: "Unauthorized or invalid user" });
    return;
  }

  try {
    const updatedDetails = await prisma.userDetails.upsert({
      where: { userId: user.id },
      update: { name, phone, address },
      create: { userId: user.id, name, phone, address },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    res.json({ message: "Profile updated", user: updatedDetails });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
