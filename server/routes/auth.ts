import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models";

const router = express.Router();

router.post("/signup", (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    User.create(username, email, password);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/login", (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = User.findByEmail(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
