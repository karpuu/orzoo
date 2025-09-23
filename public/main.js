const socket = io();

let myId = null;

// Creare partita
document.getElementById("createBtn").onclick = () => {
  const nickname = document.getElementById("nickname").value;
  socket.emit("createGame", nickname, (res) => {
    myId = socket.id;
    document.getElementById("gameId").value = res.gameId;
    document.getElementById("game").style.display = "block";
    updateGame(res.state);
  });
};

// Unirsi a partita
document.getElementById("joinBtn").onclick = () => {
  const gameId = document.getElementById("gameId").value;
  const nickname = document.getElementById("nickname").value;
  socket.emit("joinGame", { gameId, nickname }, (res) => {
    myId = socket.id;
    document.getElementById("game").style.display = "block";
    updateGame(res.state);
  });
};

// Dichiarare STÒ
document.getElementById("stoBtn").onclick = () => {
  const gameId = document.getElementById("gameId").value;
  socket.emit("declareSto", gameId);
};

// Aggiornamento stato partita
socket.on("update", (game) => {
  updateGame(game);
});

function updateGame(game) {
  document.getElementById("currentPlayer").textContent =
    game.players[game.currentPlayerIndex].name;

  const me = game.players.find(p => p.id === myId);
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";
  if (me) {
    me.hand.forEach(card => {
      const div = document.createElement("div");
      div.className = "card";
      div.textContent = `${card.valore} di ${card.seme}`;
      handDiv.appendChild(div);
    });
  }
}