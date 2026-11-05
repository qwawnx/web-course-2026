function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomPad() {
  return Math.floor(Math.random() * 4);
}

function createModel() {
  let sequence = [];
  let step = 0;
  let phase = 'idle';

  function start() {
    sequence = [randomPad()];
    step = 0;
    phase = 'showing';
  }

  function addStep() {
    sequence = [...sequence, randomPad()];
    step = 0;
    phase = 'showing';
  }

  function startInput() {
    step = 0;
    phase = 'input';
  }

  function checkPress(index) {
    if (sequence[step] !== index) {
      phase = 'gameover';
      return 'wrong';
    }
    step += 1;
    return step === sequence.length ? 'roundDone' : 'correct';
  }

  function getState() {
    return { sequence, phase, level: sequence.length };
  }

  return { start, addStep, startInput, checkPress, getState };
}

function createView() {
  const board = document.querySelector('#board');
  const pads = [...board.querySelectorAll('.pad')];
  const startButton = document.querySelector('#start');
  const levelEl = document.querySelector('#level');
  const statusEl = document.querySelector('#status');

  const statusTexts = {
    idle: 'Нажмите «Старт»',
    showing: 'Запоминайте',
    input: 'Ваш ход',
  };

  function render(state) {
    levelEl.textContent = `Уровень: ${state.level}`;
    statusEl.textContent =
      state.phase === 'gameover' ? `Игра окончена. Вы дошли до уровня ${state.level}` : statusTexts[state.phase];
    board.classList.toggle('locked', state.phase !== 'input');
    startButton.disabled = state.phase === 'showing' || state.phase === 'input';
  }

  async function flash(index, duration) {
    pads[index].classList.add('lit');
    await delay(duration);
    pads[index].classList.remove('lit');
  }

  function onPadPress(handler) {
    board.addEventListener('click', (event) => {
      const pad = event.target.closest('.pad');
      if (!pad) return;
      handler(Number(pad.dataset.index));
    });
  }

  function onStart(handler) {
    startButton.addEventListener('click', handler);
  }

  return { render, flash, onPadPress, onStart };
}

function createController(model, view) {
  async function showSequence(sequence) {
    if (sequence.length === 0) return;
    const [first, ...rest] = sequence;
    await view.flash(first, 500);
    await delay(250);
    await showSequence(rest);
  }

  async function playRound() {
    view.render(model.getState());
    await delay(600);
    await showSequence(model.getState().sequence);
    model.startInput();
    view.render(model.getState());
  }

  function handleStart() {
    model.start();
    playRound();
  }

  function handlePadPress(index) {
    if (model.getState().phase !== 'input') return;
    view.flash(index, 200);
    const result = model.checkPress(index);
    if (result === 'wrong') {
      view.render(model.getState());
      return;
    }
    if (result === 'roundDone') {
      model.addStep();
      playRound();
    }
  }

  view.onStart(handleStart);
  view.onPadPress(handlePadPress);
  view.render(model.getState());
}

createController(createModel(), createView());