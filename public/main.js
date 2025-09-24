const socket = io();

let myId = null;
let pendingSource = null; // "deck" o "discard"

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

// Pescare dal mazzo
document.getElementById("drawDeckBtn").onclick = () => {
  pendingSource = "deck";
  showPendingChoice();
};

// Pescare dagli scarti
document.getElementById("drawDiscardBtn").onclick = () => {
  pendingSource = "discard";
  showPendingChoice();
};

// Aggiornamento stato partita
socket.on("update", (game) => {
  updateGame(game);
});

function updateGame(game) {
  document.getElementById("currentPlayer").textContent =
    "Turno di: " + game.players[game.currentPlayerIndex].name;

  const me = game.players.find(p => p.id === myId);
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";

  if (me) {
    me.hand.forEach((card, idx) => {
      const div = document.createElement("div");
      div.className = "card";

      // Mostra se la carta è stata vista
      if (me.seenCards.includes(idx)) {
        div.textContent = `${card.valore} di ${card.seme}`;
      } else {
        div.textContent = "🂠";
      }

      // Se ho pescato, clic su una carta la scambia
      div.onclick = () => {
        if (pendingSource) {
          const gameId = document.getElementById("gameId").value;
          socket.emit("playTurn", {
            gameId,
            action: { from: pendingSource, keep: true, swapIndex: idx }
          });
          pendingSource = null;
          hidePendingChoice();
        }
      };

      handDiv.appendChild(div);
    });
  }

  // Mostra ultimo scarto
  const discardDiv = document.getElementById("discard");
  discardDiv.innerHTML = "";
  if (game.discardPile.length > 0) {
    const last = game.discardPile[game.discardPile.length - 1];
    discardDiv.textContent = `Ultimo scarto: ${last.valore} di ${last.seme}`;
  } else {
    discardDiv.textContent = "Nessuno scarto";
  }
}

// UI per decidere cosa fare con la carta pescata
function showPendingChoice() {
  const choiceDiv = document.getElementById("pendingChoice");
  choiceDiv.style.display = "block";
}

function hidePendingChoice() {
  const choiceDiv = document.getElementById("pendingChoice");
  choiceDiv.style.display = "none";
}

// Bottone "Scarta pescata"
document.getElementById("discardDrawnBtn").onclick = () => {
  if (pendingSource) {
    const gameId = document.getElementById("gameId").value;
    socket.emit("playTurn", {
      gameId,
      action: { from: pendingSource, keep: false }
    });
    pendingSource = null;
    hidePendingChoice();
  }
};
