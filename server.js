import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { db } from "./db.js";
import { auth } from "./auth.js";
import { generateQuiz } from "./ai.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

const SECRET = process.env.JWT_SECRET;

// --- Auth Routes ---
app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run(
    "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
    [name, email, hash, role || "student"],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      const token = jwt.sign({ id: this.lastID, role }, SECRET);
      res.json({ token });
    }
  );
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
    if (!user) return res.status(400).json({ error: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Wrong password" });
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
    res.json({ token });
  });
});

// --- Quiz Route ---
app.get("/quiz", auth, async (req, res) => {
  const questions = await generateQuiz("medium");
  res.json(questions);
});

// --- PvP / AvP WebSocket ---
io.on("connection", socket => {
  console.log("User connected", socket.id);

  socket.on("join-match", ({ matchId }) => {
    socket.join(matchId);
  });

  socket.on("submit-answer", ({ matchId, userId, answers }) => {
    db.get("SELECT * FROM matches WHERE id=?", [matchId], (err, match) => {
      if (!match) return;
      const prevScores = JSON.parse(match.scoreA || "[]");
      prevScores.push({ userId, answers });
      const score = answers.filter(a => a != null).length;
      const updatedScoreA = JSON.stringify(prevScores);

      db.run("UPDATE matches SET scoreA=? WHERE id=?", [updatedScoreA, matchId]);
      db.run(
        "INSERT INTO scores (userId,classId,score,timeTaken,createdAt) VALUES (?,?,?,?,?)",
        [userId, 0, score, 60, new Date().toISOString()]
      );
      io.to(matchId).emit("update", { userId, answers, score });
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

// --- Live Leaderboard ---
app.get("/leaderboard", auth, (req,res)=>{
  db.all(
    `SELECT u.name, SUM(s.score) as totalScore 
     FROM scores s
     JOIN users u ON s.userId = u.id
     GROUP BY s.userId
     ORDER BY totalScore DESC
     LIMIT 10`,
    [],
    (err, rows)=>{
      if(err) return res.status(500).json({error: err.message});
      res.json(rows);
    }
  );
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Mathabee running on port ${PORT}`));
