function pickDigits(pool, count) {
  if (count === 0) return '';
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] + pickDigits(pool.filter((_, i) => i !== index), count - 1);
}

function generateSecret() {
  return pickDigits([...'0123456789'], 4);
}

function countBullsAndCows(secret, guess) {
  const digits = [...guess];
  const bulls = digits.filter((digit, i) => digit === secret[i]).length;
  const cows = digits.filter((digit, i) => digit !== secret[i] && secret.includes(digit)).length;
  return { bulls, cows };
}

function validateGuess(text) {
  if (!/^\d{4}$/.test(text)) return 'Введите ровно 4 цифры';
  if (new Set(text).size !== 4) return 'Цифры не должны повторяться';
  return '';
}

function plural(number, forms) {
  const lastTwo = number % 100;
  const last = number % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

function formatAttempt(attempt) {
  const bulls = `${attempt.bulls} ${plural(attempt.bulls, ['бык', 'быка', 'быков'])}`;
  const cows = `${attempt.cows} ${plural(attempt.cows, ['корова', 'коровы', 'коров'])}`;
  return `${attempt.guess} → ${bulls}, ${cows}`;
}

function formatMessage(state) {
  const count = state.attempts.length;
  if (state.status === 'won') {
    return `Вы угадали число ${state.secret} за ${count} ${plural(count, ['попытку', 'попытки', 'попыток'])}`;
  }
  if (state.status === 'gaveUp') return `Загаданное число: ${state.secret}`;
  return '';
}

function createModel() {
  let secret = generateSecret();
  let attempts = [];
  let status = 'playing';

  function makeGuess(guess) {
    const { bulls, cows } = countBullsAndCows(secret, guess);
    attempts = [...attempts, { guess, bulls, cows }];
    status = bulls === 4 ? 'won' : 'playing';
  }

  function giveUp() {
    if (status === 'playing') status = 'gaveUp';
  }

  function reset() {
    secret = generateSecret();
    attempts = [];
    status = 'playing';
  }

  function getState() {
    return { attempts, status, secret: status === 'playing' ? null : secret };
  }

  return { makeGuess, giveUp, reset, getState };
}

function createView() {
  const form = document.querySelector('#guess-form');
  const input = form.elements.guess;
  const submitButton = document.querySelector('#guess-button');
  const newGameButton = document.querySelector('#new-game');
  const giveUpButton = document.querySelector('#give-up');
  const errorEl = document.querySelector('#error');
  const attemptsEl = document.querySelector('#attempts');
  const messageEl = document.querySelector('#message');
  const historyEl = document.querySelector('#history');

  function createHistoryItem(attempt) {
    const li = document.createElement('li');
    li.textContent = formatAttempt(attempt);
    return li;
  }

  function render(state) {
    const playing = state.status === 'playing';
    attemptsEl.textContent = `Попыток: ${state.attempts.length}`;
    submitButton.textContent = `Попытка № ${state.attempts.length + 1}`;
    input.disabled = !playing;
    submitButton.disabled = !playing;
    messageEl.textContent = formatMessage(state);
    historyEl.replaceChildren(...state.attempts.map(createHistoryItem));
    if (playing) input.focus();
  }

  function onGuess(handler) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      handler(input.value.trim());
    });
  }

  function onNewGame(handler) {
    newGameButton.addEventListener('click', handler);
  }

  function onGiveUp(handler) {
    giveUpButton.addEventListener('click', handler);
  }

  function showError(message) {
    errorEl.textContent = message;
  }

  function clearInput() {
    input.value = '';
  }

  return { render, onGuess, onNewGame, onGiveUp, showError, clearInput };
}

function createController(model, view) {
  function refresh() {
    view.render(model.getState());
  }

  function handleGuess(text) {
    const error = validateGuess(text);
    view.showError(error);
    if (error) return;
    model.makeGuess(text);
    view.clearInput();
    refresh();
  }

  function handleNewGame() {
    model.reset();
    view.showError('');
    view.clearInput();
    refresh();
  }

  function handleGiveUp() {
    model.giveUp();
    view.showError('');
    refresh();
  }

  view.onGuess(handleGuess);
  view.onNewGame(handleNewGame);
  view.onGiveUp(handleGiveUp);
  refresh();
}

createController(createModel(), createView());