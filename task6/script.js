function createModel(settings) {
  const { gridSize, appleGrowth, applePoints } = settings;

  let snake;
  let direction;
  let nextDirection;
  let apple;
  let score;
  let growthLeft;
  let status;

  function randomFreeCell(occupied) {
    const freeCells = Array.from({ length: gridSize * gridSize }, (_, i) => ({
      x: i % gridSize,
      y: Math.floor(i / gridSize),
    })).filter((cell) => !occupied.some((segment) => segment.x === cell.x && segment.y === cell.y));
    return freeCells[Math.floor(Math.random() * freeCells.length)] ?? null;
  }

  function reset() {
    snake = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = direction;
    score = 0;
    growthLeft = 0;
    status = 'running';
    apple = randomFreeCell(snake);
  }

  function setDirection(newDirection) {
    if (newDirection.x === -direction.x && newDirection.y === -direction.y) return;
    nextDirection = newDirection;
  }

  function step() {
    if (status !== 'running') return;
    direction = nextDirection;
    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };
    const eatsApple = apple !== null && newHead.x === apple.x && newHead.y === apple.y;
    const grows = eatsApple || growthLeft > 0;
    const body = grows ? snake : snake.slice(0, -1);
    const hitsWall = newHead.x < 0 || newHead.y < 0 || newHead.x >= gridSize || newHead.y >= gridSize;
    const hitsSelf = body.some((segment) => segment.x === newHead.x && segment.y === newHead.y);

    if (hitsWall || hitsSelf) {
      status = 'over';
      return;
    }

    snake = grows ? [newHead, ...snake] : [newHead, ...snake.slice(0, -1)];

    if (eatsApple) {
      score += applePoints;
      growthLeft += appleGrowth - 1;
      apple = randomFreeCell(snake);
      if (apple === null) status = 'over';
    } else if (growthLeft > 0) {
      growthLeft -= 1;
    }
  }

  function getState() {
    return { snake, apple, score, status, gridSize };
  }

  reset();

  return { reset, step, setDirection, getState };
}

function createView() {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.querySelector('#score');
  const restartButton = document.querySelector('#restart');

  function drawSnake(snake, cell) {
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#1b5e20' : '#43a047';
      ctx.fillRect(segment.x * cell + 1, segment.y * cell + 1, cell - 2, cell - 2);
    });
  }

  function drawApple(apple, cell) {
    if (apple === null) return;
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(apple.x * cell + cell / 2, apple.y * cell + cell / 2, cell / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGameOver(score) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Игра окончена', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText(`Счёт: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
  }

  function render(state) {
    const cell = canvas.width / state.gridSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawApple(state.apple, cell);
    drawSnake(state.snake, cell);
    scoreEl.textContent = `Счёт: ${state.score}`;
    restartButton.hidden = state.status === 'running';
    if (state.status === 'over') drawGameOver(state.score);
  }

  function onKey(handler) {
    document.addEventListener('keydown', (event) => {
      if (event.key.startsWith('Arrow')) event.preventDefault();
      handler(event.key);
    });
  }

  function onRestart(handler) {
    restartButton.addEventListener('click', handler);
  }

  return { render, onKey, onRestart };
}

function createController(model, view) {
  const moveInterval = 150;
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };

  let lastMoveTime = 0;

  function frame(currentTime) {
    if (currentTime - lastMoveTime >= moveInterval) {
      model.step();
      lastMoveTime = currentTime - ((currentTime - lastMoveTime) % moveInterval);
    }
    view.render(model.getState());
    if (model.getState().status === 'running') requestAnimationFrame(frame);
  }

  function startLoop() {
    lastMoveTime = performance.now();
    requestAnimationFrame(frame);
  }

  function handleKey(key) {
    const newDirection = directions[key];
    if (newDirection) model.setDirection(newDirection);
  }

  function handleRestart() {
    model.reset();
    startLoop();
  }

  view.onKey(handleKey);
  view.onRestart(handleRestart);
  startLoop();
}

createController(createModel({ gridSize: 20, appleGrowth: 1, applePoints: 1 }), createView());