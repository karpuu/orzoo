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
    // Rendi visibili solo le prime 2 per 10 secondi
    player.seenCards = [0, 1];
    setTimeout(() => {
      player.seenCards = [];
    }, 10000);
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
  // Mostra solo le prime 2 per 10 secondi
  newPlayer.seenCards = [0, 1];
  setTimeout(() => {
    newPlayer.seenCards = [];
  }, 10000);

  game.players.push(newPlayer);
  return true;
}

// Turno di gioco
export function playTurn(game, playerId, action) {
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  const player = game.players[playerIndex];

  if (game.players[game.currentPlayerIndex].id !== playerId) {
    return { success: false, message: "Non è il tuo turno" };
  }

  // Pesca dal mazzo o dagli scarti
  let drawnCard;
  if (action.from === "deck") {
    drawnCard = game.deck.pop();
  } else if (action.from === "discard") {
    drawnCard = game.discardPile.pop();
  } else {
    return { success: false, message: "Fonte non valida" };
  }

  // Decidi se tenere o scartare
  let discarded;
  if (action.keep) {
    const idx = action.swapIndex;
    discarded = player.hand[idx];
    player.hand[idx] = drawnCard;
    game.discardPile.push(discarded);
  } else {
    discarded = drawnCard;
    game.discardPile.push(discarded);
  }

  // Gestisci potere speciale
  handleSpecial(discarded, player, game);

  // Scarto reattivo: qualsiasi numero può essere replicato
  game.players.forEach(p => {
    if (p.id !== playerId) {
      const cardIndex = p.hand.findIndex(c => c.valore === discarded.valore);
      if (cardIndex >= 0 && action.reactToDiscard && action.reactToDiscard[p.id]) {
        const scartata = p.hand.splice(cardIndex, 1)[0];
        game.discardPile.push(scartata);

        // Se lo scarto è sbagliato → penalità (pesca 2 carte)
        if (!action.reactToDiscard[p.id].correct) {
          p.hand.push(game.deck.pop());
          p.hand.push(game.deck.pop());
        }
      }
    }
  });

  // Passa turno
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  return { success: true };
}

// Dichiarazione STÒ
export function declareSto(game, playerId) {
  game.stoDeclared = playerId;
  const player = game.players.find(p => p.id === playerId);
  if (player) player.stoImmune = true;
}

// Calcolo punti
export function calculatePoints(player) {
  return player.hand.reduce((sum, card) => {
    return sum + card.valore; // ora 8=8, 9=9, 10=10
  }, 0);
}

// Gestione poteri speciali
function handleSpecial(card, player, game) {
  switch (card.valore) {
    case 8: // Fante
      // Guarda una tua carta (aggiungi indice a seenCards)
      if (player.hand.length > 0) {
        player.seenCards.push(0); // esempio: prima carta
      }
      break;
    case 9: // Cavallo
      // Scambia con altro giocatore (da decidere lato frontend)
      break;
    case 10: // Re
      // Dai una carta del mazzo a un altro giocatore
      if (game.deck.length > 0) {
        const target = game.players.find(p => p.id !== player.id);
        if (target) target.hand.push(game.deck.pop());
      }
      break;
    default:
      break;
  }
}
