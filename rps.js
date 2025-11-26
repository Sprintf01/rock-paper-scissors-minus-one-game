// rps.js
let timerActive = false;
let timerId = null;

let score = JSON.parse(localStorage.getItem('score')) || {
  wins: 0,
  losses: 0,
  ties: 0
};

// ---------- History storage ----------
let playerHistory = JSON.parse(localStorage.getItem('playerHistory')) || []; // array of strings
function pushPlayerMoveToHistory(move) {
  playerHistory.push(move);
  const MAX = 2000; // cap history
  if (playerHistory.length > MAX) playerHistory = playerHistory.slice(-MAX);
  localStorage.setItem('playerHistory', JSON.stringify(playerHistory));
}

// -------- Move utilities ----------
const moveToIndex = { rock: 0, paper: 1, scissors: 2 };
const indexToMove = ['rock', 'paper', 'scissors'];

function oneHotArray(idx) {
  const arr = [0, 0, 0];
  arr[idx] = 1;
  return arr;
}

// -------- RNN Model --------
let rnnModel = null;
let rnnReady = false;
const SEQ_LENGTH = 10;

async function initRNN() {
  if (rnnModel) return;

  rnnModel = tf.sequential();
  rnnModel.add(tf.layers.simpleRNN({ units: 10, inputShape: [SEQ_LENGTH, 3] }));
  rnnModel.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
  rnnModel.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

  console.log('RNN Initialized');
}

async function trainRNN() {
  if (playerHistory.length < SEQ_LENGTH + 1) {
    console.log(`Not enough history to train RNN (${playerHistory.length}/${SEQ_LENGTH + 1})`);
    return;
  }

  const xsData = [];
  const ysData = [];

  for (let i = 0; i <= playerHistory.length - SEQ_LENGTH - 1; i++) {
    const seq = playerHistory.slice(i, i + SEQ_LENGTH).map(m => oneHotArray(moveToIndex[m]));
    const nextMove = oneHotArray(moveToIndex[playerHistory[i + SEQ_LENGTH]]);
    xsData.push(seq);
    ysData.push(nextMove);
  }

  const xs = tf.tensor(xsData); // [batch, SEQ_LENGTH, 3]
  const ys = tf.tensor(ysData); // [batch, 3]

  await rnnModel.fit(xs, ys, { epochs: 3, verbose: 0 });
  rnnReady = true;
  console.log('RNN trained on latest history');
}

function predictNextPlayerMove() {
  if (!rnnReady || playerHistory.length < SEQ_LENGTH) {
    console.log('RNN not ready or not enough history for prediction');
    return null;
  }

  const lastSeq = playerHistory.slice(-SEQ_LENGTH).map(m => oneHotArray(moveToIndex[m]));
  const input = tf.tensor([lastSeq]); // [1, SEQ_LENGTH, 3]
  const prediction = rnnModel.predict(input);
  const predictedIdx = prediction.argMax(-1).dataSync()[0];
  const predictedMove = indexToMove[predictedIdx];
  console.log('Predicted next player move:', predictedMove);
  return predictedMove;
}

// --------- Game variables ----------
let result = '';
let movesobj = { hand1: '', hand2: '' };
let computerMove1 = pickComputerMove();
let computerMove2 = pickComputerMove();
let playerMove = '';

updateScoreElement();

// --------- DOM & Game functions ----------
function selectMove(hand, move) {
  movesobj[hand] = move;
  console.log('selected:', movesobj);
}

function showChoices() {
  if (movesobj.hand1 === '' || movesobj.hand2 === '') {
    alert('You have not selected your moves');
    return;
  }

  document.getElementById('hand1').style.display = 'none';
  document.getElementById('hand2').style.display = 'none';
  document.getElementById('show-hands-button').style.display = 'none';
  document.getElementById('blurred-image').style.display = 'none';

  document.querySelector('.ur-moves').innerHTML = `
    <div class="aftershow" style="margin-left:170px;">You Chose:
      <button class="choices" onclick="playGame('${movesobj.hand1}')">
        <img src="${movesobj.hand1}-emoji.png" class="move-icon">
      </button>
      <button class="choices" onclick="playGame('${movesobj.hand2}')">
        <img src="${movesobj.hand2}-emoji.png" class="move-icon">
      </button>
      <br>
      (now choose which hand to keep)
    </div>
  `;

  document.querySelector('.timer').innerHTML = `
    <div class="aftershow">(You have 4.56 seconds to choose)</div>
  `;

  document.querySelector('.c-moves').innerHTML = `
    <div class="aftershow" style="margin-left:70px; margin-top:50px;">Computer Chose:
      <img src="${computerMove1}-emoji.png" class="move-icon">
      <img src="${computerMove2}-emoji.png" class="move-icon">
    </div>
  `;

  playerMove = '';
  timerActive = true;
  timerId = setTimeout(timerfxn, 4560);
}

// --------- Play game logic ----------
async function playGame(selectedMove) {
  if (timerActive) {
    clearTimeout(timerId);
    timerActive = false;
  }

  playerMove = selectedMove;
  pushPlayerMoveToHistory(playerMove);

  await initRNN();
  await trainRNN();

  // Computer chooses 1 of its 2 moves
  let computerMove;
  if (rnnReady && playerHistory.length >= 10) {
    const predictedMove = predictNextPlayerMove();
    const counter = counterMoveTo(predictedMove);

    // pick from two shown hands with 70% chance to counter predicted
    if (Math.random() < 0.7) {
      computerMove = [computerMove1, computerMove2].includes(counter) ? counter : computerMove1;
    } else {
      computerMove = Math.random() < 0.5 ? computerMove1 : computerMove2;
    }
  } else {
    computerMove = Math.random() < 0.5 ? computerMove1 : computerMove2;
    console.log('RNN not ready; using random computer move');
  }

  // Determine result
  if (playerMove === 'scissors') {
    if (computerMove === 'rock') result = 'You lose.';
    else if (computerMove === 'paper') result = 'You win.';
    else result = 'Tie.';
  } else if (playerMove === 'paper') {
    if (computerMove === 'rock') result = 'You win.';
    else if (computerMove === 'paper') result = 'Tie.';
    else result = 'You lose.';
  } else if (playerMove === 'rock') {
    if (computerMove === 'rock') result = 'Tie.';
    else if (computerMove === 'paper') result = 'You lose.';
    else result = 'You win.';
  }

  if (result === 'You win.') score.wins += 1;
  else if (result === 'You lose.') score.losses += 1;
  else score.ties += 1;

  localStorage.setItem('score', JSON.stringify(score));
  updateScoreElement();

  document.querySelector('.js-result').innerHTML = result;
  document.querySelector('.ur-moves').innerHTML = `
    <img style="margin-left: 150px;" src="${playerMove}-emoji.png" class="move-icon">
  `;
  document.querySelector('.c-moves').innerHTML = `
    <img src="${computerMove}-emoji.png" class="move-icon" style="margin-left:60px; margin-top:45px;">
  `;

  // Reset game after delay
  setTimeout(resetGame, 3000);
}

function counterMoveTo(move) {
  if (move === 'rock') return 'paper';
  if (move === 'paper') return 'scissors';
  return 'rock';
}

// --------- Reset game ----------
function resetGame() {
  if (timerActive) {
    clearTimeout(timerId);
    timerActive = false;
  }

  movesobj = { hand1: '', hand2: '' };
  playerMove = '';
  computerMove1 = pickComputerMove();
  computerMove2 = pickComputerMove();

  document.getElementById('hand1').style.display = 'block';
  document.getElementById('hand2').style.display = 'block';
  document.getElementById('show-hands-button').style.display = 'block';
  document.getElementById('blurred-image').style.display = 'block';

  document.querySelector('.ur-moves').innerHTML = '';
  document.querySelector('.c-moves').innerHTML = '';
  document.querySelector('.js-result').innerHTML = '';
  document.querySelector('.timer').innerHTML = '';
}

// --------- Computer move selection ---------
function pickComputerMove() {
  const randomNumber = Math.random();
  if (randomNumber < 1 / 3) return 'rock';
  else if (randomNumber < 2 / 3) return 'paper';
  else return 'scissors';
}

// --------- Timer ----------
function timerfxn() {
  if (!timerActive) return;
  timerActive = false;
  if (playerMove === '') {
    alert('You took too long to choose :( Computer gets a point');
    score.losses += 1;
    localStorage.setItem('score', JSON.stringify(score));
    updateScoreElement();
    document.querySelector('.js-result').innerHTML = 'You lose.';
    resetGame();
  }
}

// --------- Score ----------
function updateScoreElement() {
  document.querySelector('.js-score').innerHTML = `Wins: ${score.wins}, Losses: ${score.losses}, Ties: ${score.ties}`;
}

function resetScore() {
  score = { wins: 0, losses: 0, ties: 0 };
  localStorage.removeItem('score');
  updateScoreElement();
}
