// game.js
import { createDeck } from "./deck.js";

// Crea una nuova partita
export function createGame(gameId, hostId, hostName) {
  const deck = createDeck();
  const players = [
    { id: hostId, name: hostName, hand: [], points: 0, seenCards: [], stoImmune: false }
  ];
  const discardPile = [];
  const state = {
    gameId,
    deck,
    players,
    discardPile,
    currentPlayerIndex: 0,
    stoDeclared: null,
    round: 1
  };
  // Distribuisci 4 carte a ciascun giocatore
  players.forEach(player => {
    for (let i = 0; i < 4; i++) {
      player.hand.push(deck.pop());
    }
  });
  return state;
}

// Unisce un nuovo giocatore alla partita
export function joinGame(game, playerId, playerName) {
  if (game.players.length >= 6) return false;
  const newPlayer = {
    id: playerId,
    name: playerName,
    hand: [],
    points: 0,
    seenCards: [],
    stoImmune: false
  };
  for (let i = 0; i < 4; i++) {
    newPlayer.hand.push(game.deck.pop());
  }
  game.players.push(newPlayer);
  return true;
}

// Funzione principale per gestire un turno
export function playTurn(game, playerId, action) {
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  const player = game.players[playerIndex];

  if (game.players[game.currentPlayerIndex].id !== playerId) {
    return { success: false, message: "Non è il tuo turno" };
  }

  // Pesca carta (dal mazzo o scarti)
  let drawnCard;
  if (action.from === "deck") {
    drawnCard = game.deck.pop();
  } else if (action.from === "discard") {
    drawnCard = game.discardPile.pop();
  } else {
    return { success: false, message: "Fonte non valida" };
  }

  // Decidi se tenere o scartare
  if (action.keep) {
    // Scambia con una delle sue carte
    const idx = action.swapIndex;
    const discarded = player.hand[idx];
    player.hand[idx] = drawnCard;
    game.discardPile.push(discarded);
    handleSpecial(discarded, player, game);
  } else {
    // Scarta direttamente
    game.discardPile.push(drawnCard);
    handleSpecial(drawnCard, player, game);
  }

  // Scarto reattivo: controlla se altri giocatori vogliono scartare la stessa carta
  game.players.forEach(p => {
    if (p.id !== playerId) {
      const cardIndex = p.hand.findIndex(c => c.valore === drawnCard.valore);
      if (cardIndex >= 0) {
        // Può scartarla per ridurre punti
        if (action.reactToDiscard && action.reactToDiscard[p.id]) {
          const scartata = p.hand.splice(cardIndex, 1)[0];
          game.discardPile.push(scartata);
          // Se scarta carta di un altro sbagliando, pesca 2 carte di penalità
          if (!action.reactToDiscard[p.id].correct) {
            p.hand.push(game.deck.pop());
            p.hand.push(game.deck.pop());
          }
        }
      }
    }
  });

  // Passa al turno successivo
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  return { success: true };
}

// Gestione dichiarazione STÒ
export function declareSto(game, playerId) {
  game.stoDeclared = playerId;
  const player = game.players.find(p => p.id === playerId);
  if (player) player.stoImmune = true;
}

// Calcolo punti
export function calculatePoints(player) {
  // Fante/Cavallo/Re valgono 10 punti
  return player.hand.reduce((sum, card) => {
    if (card.valore >= 8) return sum + 10;
    return sum + card.valore;
  }, 0);
}

// Gestione poteri speciali
function handleSpecial(card, player, game) {
  switch (card.valore) {
    case 8: // Fante
      // Guarda una tua carta
      break;
    case 9: // Cavallo
      // Scambia una tua carta con un altro giocatore o tra altri
      break;
    case 10: // Re
      // Dai una carta del mazzo a un altro giocatore
      break;
    default:
      break;
  }
}