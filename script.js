let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('search');
const filterCategory = document.getElementById('filterCategory');
const filterPriority = document.getElementById('filterPriority');
const filterStatus = document.getElementById('filterStatus');
const sortTasks = document.getElementById('sortTasks');

const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const dueTodayEl = document.getElementById('dueToday');
const overdueTasksEl = document.getElementById('overdueTasks');
const progressPercent = document.getElementById('progressPercent');
const progressBar = document.getElementById('progressBar');
const circularProgress = document.querySelector('.circular-progress .progress');

const toggleModeBtn = document.querySelector('.toggle-mode');
toggleModeBtn.addEventListener('click', () => document.body.classList.toggle('dark'));

// ===== Helpers =====
function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }

function updateFilters() {
  const categories = [...new Set(tasks.map(t => t.category).filter(c => c))];
  filterCategory.innerHTML = '<option value="">All Categories</option>' +
    categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function animateNumber(el, start, end, duration=500) {
  const range = end - start;
  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const current = Math.round(start + (range * Math.min(progress / duration,1)));
    el.textContent = current;
    if (progress < duration) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function calculateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const today = new Date().toISOString().split('T')[0];
  const dueTodayCount = tasks.filter(t => t.dueDate === today && !t.completed).length;
  const overdueCount = tasks.filter(t => t.dueDate && t.dueDate < today && !t.completed).length;

  totalTasksEl.textContent = total;
  completedTasksEl.textContent = completed;
  dueTodayEl.textContent = dueTodayCount;
  overdueTasksEl.textContent = overdueCount;

  const percent = total ? Math.round((completed/total)*100) : 0;
  circularProgress.style.transition = 'stroke-dashoffset 1s ease';
  circularProgress.style.strokeDashoffset = 314 - (314 * percent / 100);
  progressBar.style.transition = 'width 1s ease';
  progressBar.style.width = `${percent}%`;
  const currentPercent = parseInt(progressPercent.textContent) || 0;
  animateNumber(progressPercent, currentPercent, percent, 800);
}

function renderTasks() {
  let filteredTasks = [...tasks];
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) filteredTasks = filteredTasks.filter(t =>
    t.title.toLowerCase().includes(searchTerm) ||
    (t.description && t.description.toLowerCase().includes(searchTerm))
  );

  if (filterCategory.value) filteredTasks = filteredTasks.filter(t => t.category === filterCategory.value);
  if (filterPriority.value) filteredTasks = filteredTasks.filter(t => t.priority === filterPriority.value);
  if (filterStatus.value === 'completed') filteredTasks = filteredTasks.filter(t => t.completed);
  if (filterStatus.value === 'pending') filteredTasks = filteredTasks.filter(t => !t.completed);

  if (sortTasks.value === 'due') filteredTasks.sort((a,b) => (a.dueDate||'')>(b.dueDate||'')?1:-1);
  else if (sortTasks.value === 'priority') {
    const order={High:1, Medium:2, Low:3,"":4};
    filteredTasks.sort((a,b)=>order[a.priority]-order[b.priority]);
  } else filteredTasks.sort((a,b)=>a.createdAt-b.createdAt);

  taskList.innerHTML = '';
  filteredTasks.forEach((task, idx) => {
    const card = document.createElement('div');
    card.className='task-card';
    if(task.completed) card.classList.add('completed');
    card.innerHTML=`
      <h3>${task.title}</h3>
      ${task.description?`<p>${task.description}</p>`:''}
      ${task.dueDate?`<p>Due: ${task.dueDate}</p>`:''}
      ${task.priority?`<p>Priority: ${task.priority}</p>`:''}
      ${task.category?`<p>Category: ${task.category}</p>`:''}
      <div class="task-actions">
        <button class="complete-btn">${task.completed?'Uncomplete':'Complete'}</button>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    card.querySelector('.complete-btn').addEventListener('click',()=>toggleComplete(idx));
    card.querySelector('.edit-btn').addEventListener('click',()=>editTask(idx));
    card.querySelector('.delete-btn').addEventListener('click',()=>removeTask(idx));

    taskList.appendChild(card);
  });

  updateFilters();
  calculateStats();
}

// ===== Task Actions =====
function removeTask(index) {
  tasks.splice(index,1);
  saveTasks();
  renderTasks();
}

function editTask(index) {
  const task = tasks[index];
  document.getElementById('title').value = task.title;
  document.getElementById('description').value = task.description || '';
  document.getElementById('dueDate').value = task.dueDate || '';
  document.getElementById('priority').value = task.priority || '';
  document.getElementById('category').value = task.category || '';

  // Mark as editing (instead of deleting)
  taskForm.dataset.editIndex = index;
}

function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  renderTasks();
}

// ===== Form Submission =====
taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  if(!title) return;
  const description = document.getElementById('description').value.trim();
  const dueDate = document.getElementById('dueDate').value;
  const priority = document.getElementById('priority').value;
  const category = document.getElementById('category').value.trim();

  if(taskForm.dataset.editIndex !== undefined) {
    // Edit in-place
    const idx = parseInt(taskForm.dataset.editIndex);
    tasks[idx] = { ...tasks[idx], title, description, dueDate, priority, category };
    delete taskForm.dataset.editIndex;
  } else {
    tasks.push({ title, description, dueDate, priority, category, completed: false, createdAt: Date.now() });
  }

  saveTasks();
  renderTasks();
  taskForm.reset();
});

// ===== Filters =====
searchInput.addEventListener('input', renderTasks);
filterCategory.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', renderTasks);
filterStatus.addEventListener('change', renderTasks);
sortTasks.addEventListener('change', renderTasks);

// ===== Initial Render =====
renderTasks();
