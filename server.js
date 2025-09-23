import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createGame, joinGame, playTurn, declareSto } from "./game.js";

const app = express();
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // permette connessioni da qualsiasi frontend
});

// Ogni stanza con le partite
const games = {}; // idStanza -> stato partita

io.on("connection", (socket) => {
  console.log("Nuovo giocatore collegato:", socket.id);

  // Creare una nuova partita
  socket.on("createGame", (nickname, callback) => {
    const gameId = Math.random().toString(36).substring(2, 8);
    games[gameId] = createGame(gameId, socket.id, nickname);
    socket.join(gameId);
    callback({ gameId, state: games[gameId] });
    io.to(gameId).emit("update", games[gameId]);
  });

  // Unire un giocatore a una partita esistente
  socket.on("joinGame", ({ gameId, nickname }, callback) => {
    if (!games[gameId]) return callback({ error: "Partita non trovata" });
    joinGame(games[gameId], socket.id, nickname);
    socket.join(gameId);
    callback({ state: games[gameId] });
    io.to(gameId).emit("update", games[gameId]);
  });

  // Eseguire un turno (pesca, scarto, poteri)
  socket.on("playTurn", ({ gameId, action }, callback) => {
    const result = playTurn(games[gameId], socket.id, action);
    io.to(gameId).emit("update", games[gameId]);
    callback(result);
  });

  // Dichiarazione STÒ
  socket.on("declareSto", (gameId) => {
    declareSto(games[gameId], socket.id);
    io.to(gameId).emit("update", games[gameId]);
  });

  // Disconnessione giocatore
  socket.on("disconnect", () => {
    console.log("Giocatore disconnesso:", socket.id);
    // TODO: gestire se uno esce dalla partita
  });
});

// Server attivo sulla porta 3000
server.listen(3000, () => {
  console.log("Server avviato su http://localhost:3000");
});
