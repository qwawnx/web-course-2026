function startApp() {
  const form = document.querySelector('#todo-form');
  const errorEl = document.querySelector('#error');
  const counterEl = document.querySelector('#counter');
  const listEl = document.querySelector('#todo-list');
  const filtersEl = document.querySelector('.filters');

  let tasks = [];
  let currentFilter = 'all';
  let nextId = 1;

  const filterRules = {
    all: () => true,
    active: (task) => !task.completed,
    completed: (task) => task.completed,
  };

  function validateText(text) {
    if (text === '') return 'Введите текст задачи';
    if (text.length > 100) return 'Не больше 100 символов';
    return '';
  }

  function addTask(text) {
    tasks = [...tasks, { id: nextId++, text, completed: false }];
  }

  function toggleTask(id) {
    tasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task));
  }

  function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
  }

  function createTaskElement(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    li.className = task.completed ? 'task completed' : 'task';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;

    const text = document.createElement('span');
    text.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete';
    deleteButton.textContent = 'Удалить';

    li.append(checkbox, text, deleteButton);
    return li;
  }

  function renderCounter() {
    const total = tasks.length;
    const done = tasks.filter((task) => task.completed).length;
    counterEl.textContent = `Всего: ${total}, Осталось: ${total - done}, Выполнено: ${done}`;
  }

  function renderFilters() {
    filtersEl.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('active', button.dataset.filter === currentFilter);
    });
  }

  function render() {
    const visibleTasks = tasks.filter(filterRules[currentFilter]);
    listEl.replaceChildren(...visibleTasks.map(createTaskElement));
    renderCounter();
    renderFilters();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const text = new FormData(form).get('text').trim();
    const error = validateText(text);
    errorEl.textContent = error;
    if (error) return;
    addTask(text);
    form.reset();
    render();
  }

  function handleListChange(event) {
    const li = event.target.closest('li');
    toggleTask(Number(li.dataset.id));
    render();
  }

  function handleListClick(event) {
    if (!event.target.matches('.delete')) return;
    const li = event.target.closest('li');
    deleteTask(Number(li.dataset.id));
    render();
  }

  function handleFilterClick(event) {
    const filter = event.target.dataset.filter;
    if (!filter) return;
    currentFilter = filter;
    render();
  }

  form.addEventListener('submit', handleSubmit);
  listEl.addEventListener('change', handleListChange);
  listEl.addEventListener('click', handleListClick);
  filtersEl.addEventListener('click', handleFilterClick);

  render();
}

startApp();