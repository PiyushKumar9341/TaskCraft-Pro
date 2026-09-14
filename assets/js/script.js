/* =========================================================
   TASKCRAFT PRO | SMART PRODUCTIVITY SUITE - APP LOGIC
   ========================================================= */

// 1. Firebase Configuration & Initialization
const firebaseConfig = {
  apiKey: "AIzaSyDJfJ1NkJOmmsYSb7RLJPFeZR_8-tqoUgQ",
  authDomain: "advanced-todo-b93ba.firebaseapp.com",
  projectId: "advanced-todo-b93ba",
  storageBucket: "advanced-todo-b93ba.firebasestorage.app",
  messagingSenderId: "685947792786",
  appId: "1:685947792786:web:e49cf23e4a977c4c0be54b",
  measurementId: "G-CWBZZYCR1M"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// 2. DOM Element Selectors
const taskInput            = document.getElementById('taskInput');
const prioritySelect       = document.getElementById('prioritySelect');
const searchInput          = document.getElementById('searchInput');
const addTaskBtn           = document.getElementById('addTaskBtn');
const taskList             = document.getElementById('taskList');
const filterButtons        = document.querySelectorAll('.filter-btn');
const clearAllBtn          = document.getElementById('clearAllBtn');
const darkModeToggle       = document.getElementById('darkModeToggle');
const scrollToTopBtn       = document.getElementById('scrollToTopBtn');
const quoteElement         = document.getElementById('quote');
const messageBox           = document.getElementById('messageBox');
const googleLoginBtn       = document.getElementById('googleLoginBtn');
const logoutBtn            = document.getElementById('logoutBtn');
const personalizedGreeting = document.getElementById('personalizedGreeting');
const userNameSpan         = document.getElementById('userName');
const welcomeOverlay       = document.getElementById('welcomeOverlay');
const welcomeModal         = document.getElementById('welcomeModal');
const userNameInput        = document.getElementById('userNameInput');
const submitNameBtn        = document.getElementById('submitNameBtn');
const emailAddressFooter   = document.getElementById('emailAddressFooter');
const copyEmailBtnFooter   = document.getElementById('copyEmailBtnFooter');
const statsBar             = document.getElementById('statsBar');

// ---------------------------------------------------------
// 3. Application State
// ---------------------------------------------------------
let currentFilter = 'all';
let searchQuery   = '';
let currentUser   = null;
let tasks         = [];

// ---------------------------------------------------------
// 4. Toast Notification Manager
// ---------------------------------------------------------
function showMessage(text, type = 'info') {
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.style.display = 'block';

  if (type === 'error') {
    messageBox.style.backgroundColor = '#fee2e2';
    messageBox.style.color = '#b91c1c';
  } else {
    messageBox.style.backgroundColor = '#d1fae5';
    messageBox.style.color = '#065f46';
  }

  requestAnimationFrame(() => {
    messageBox.style.opacity = '1';
  });

  setTimeout(() => {
    messageBox.style.opacity = '0';
    setTimeout(() => {
      messageBox.style.display = 'none';
    }, 250);
  }, 2000);
}

// ---------------------------------------------------------
// 5. User Name & Greeting Management
// ---------------------------------------------------------
function saveLocalName(name) {
  if (!name) return;
  localStorage.setItem('userName', name);
}

function getLocalName() {
  return localStorage.getItem('userName') || '';
}

function clearLocalName() {
  localStorage.removeItem('userName');
}

const aiNudgesByTime = {
  morning: [
    "Ready to conquer your day?",
    "Set a great tone for your morning.",
    "Small steps this morning lead to big wins.",
    "Fresh start! What’s your #1 target today?",
    "Fuel your focus early today."
  ],
  afternoon: [
    "Pick a task and keep your momentum going.",
    "Beat the slump with one quick win.",
    "Stay sharp! Focus on the next 20 minutes.",
    "Momentum is built right now.",
    "One completed task changes your whole day."
  ],
  evening: [
    "Wrap up your day with one solid win.",
    "Finish strong before you rest.",
    "Clear your mind by clearing one task.",
    "You’re one focused task away from feeling great.",
    "End the day on a high note."
  ],
  night: [
    "A small step tonight makes tomorrow easier.",
    "Prep for tomorrow by checking off one item.",
    "Quiet focus late at night works wonders.",
    "Clear your plate for a peaceful sleep.",
    "Late night focus session activated."
  ]
};

let currentAiNudge = '';

function getRandomNudge() {
  if (currentAiNudge) return currentAiNudge;

  const hour = new Date().getHours();
  let pool = aiNudgesByTime.evening;

  if (hour >= 5 && hour < 12) {
    pool = aiNudgesByTime.morning;
  } else if (hour >= 12 && hour < 17) {
    pool = aiNudgesByTime.afternoon;
  } else if (hour >= 17 && hour < 22) {
    pool = aiNudgesByTime.evening;
  } else {
    pool = aiNudgesByTime.night;
  }

  const idx = Math.floor(Math.random() * pool.length);
  currentAiNudge = pool[idx];
  return currentAiNudge;
}

function getPopupAiMessage(name) {
  const advice = getRandomNudge();
  const cleanName = name && name.trim() ? name.trim() : '';
  return cleanName 
    ? `<span class="ai-name-highlight">${cleanName}</span>, ${advice}` 
    : advice;
}

function updateModalHeading() {
  const heading = document.getElementById('welcomeModalHeading');
  if (!heading) return;
  const currentName = userNameInput ? userNameInput.value.trim() : '';
  heading.innerHTML = getPopupAiMessage(currentName);
}

function updateGreeting(name) {
  if (!personalizedGreeting || !userNameSpan) return;

  if (name && name.trim() !== '') {
    userNameSpan.textContent = name;
    personalizedGreeting.style.display = 'block';
  } else {
    userNameSpan.textContent = '';
    personalizedGreeting.style.display = 'none';
  }
}

if (userNameSpan) {
  userNameSpan.addEventListener('click', () => {
    openWelcomeModal();
  });
}

// ---------------------------------------------------------
// 6. AI Welcome Modal Handlers
// ---------------------------------------------------------
function openWelcomeModal() {
  if (!welcomeOverlay) return;
  currentAiNudge = ''; // Pick a fresh random nudge every time modal opens
  const savedName = getLocalName();
  if (userNameInput && savedName) {
    userNameInput.value = savedName;
  }
  updateModalHeading();
  welcomeOverlay.style.display = 'flex';
  requestAnimationFrame(() => {
    welcomeOverlay.classList.add('show');
  });
}

function closeWelcomeModal() {
  if (!welcomeOverlay) return;
  welcomeOverlay.classList.remove('show');
  setTimeout(() => {
    welcomeOverlay.style.display = 'none';
  }, 300);
}

if (submitNameBtn) {
  submitNameBtn.addEventListener('click', () => {
    const name = userNameInput ? userNameInput.value.trim() : '';
    if (!name) {
      showMessage('Please enter your name.', 'error');
      return;
    }

    saveLocalName(name);
    updateGreeting(name);
    updateModalHeading();

    submitNameBtn.textContent = 'Nice, let’s go! 🚀';

    setTimeout(() => {
      closeWelcomeModal();
      setTimeout(() => {
        submitNameBtn.textContent = "Nice, let’s go!";
      }, 400);
    }, 400);
  });
}

if (userNameInput) {
  userNameInput.addEventListener('input', updateModalHeading);
  userNameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (submitNameBtn) submitNameBtn.click();
    }
  });
}

// ---------------------------------------------------------
// 7. Firestore Synchronization Helpers
// ---------------------------------------------------------
function getTasksCollectionRef(uid) {
  return db.collection('users').doc(uid).collection('tasks');
}

async function loadTasksForUser(uid) {
  if (!uid) {
    tasks = [];
    renderTasks();
    return;
  }
  try {
    const snap = await getTasksCollectionRef(uid).orderBy('createdAt', 'asc').get();
    tasks = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderTasks();
  } catch (err) {
    console.error('Error loading tasks:', err);
    showMessage('Could not load tasks.', 'error');
    tasks = [];
    renderTasks();
  }
}

// ---------------------------------------------------------
// Confetti Celebration Engine
// ---------------------------------------------------------
function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  for (let i = 0; i < 75; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 + 80,
      radius: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.85) * 18,
      opacity: 1,
      decay: Math.random() * 0.02 + 0.015
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      if (p.opacity > 0) {
        active = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45;
        p.opacity -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (active) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

async function addTaskToUser(uid, text, priority = 'medium') {
  if (!uid) return;
  const colRef = getTasksCollectionRef(uid);
  const docRef = await colRef.add({
    text,
    priority,
    completed: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  tasks.push({ id: docRef.id, text, priority, completed: false });
  renderTasks();
}

async function updateTaskCompletion(uid, taskId, completed) {
  if (!uid) return;
  const colRef = getTasksCollectionRef(uid);
  await colRef.doc(taskId).update({ completed });
  const t = tasks.find(t => t.id === taskId);
  if (t) t.completed = completed;
  if (completed) {
    triggerConfetti();
  }
  renderTasks();
}

async function deleteTask(uid, taskId) {
  if (!uid) return;
  const colRef = getTasksCollectionRef(uid);
  await colRef.doc(taskId).delete();
  tasks = tasks.filter(t => t.id !== taskId);
  renderTasks();
}

async function clearAllTasks(uid) {
  if (!uid) return;
  const colRef = getTasksCollectionRef(uid);
  const snap = await colRef.get();
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  tasks = [];
  renderTasks();
}

// ---------------------------------------------------------
// 8. Render Task List & Stats Bar (With Priority Badges & Search)
// ---------------------------------------------------------
function getPriorityWeight(p) {
  if (p === 'high') return 3;
  if (p === 'medium') return 2;
  if (p === 'low') return 1;
  return 2;
}

function renderTasks() {
  if (!taskList) return;
  taskList.innerHTML = '';

  let filtered = tasks;

  if (currentFilter === 'active') {
    filtered = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = tasks.filter(t => t.completed);
  }

  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(t => t.text && t.text.toLowerCase().includes(q));
  }

  filtered.sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));

  if (filtered.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'empty-state-item';
    emptyLi.style.justifyContent = 'center';
    emptyLi.style.color = 'var(--text-muted)';
    emptyLi.style.fontSize = '0.9em';
    emptyLi.style.fontStyle = 'italic';
    emptyLi.style.padding = '18px';
    emptyLi.textContent = currentFilter === 'completed'
      ? 'No completed tasks yet ✨'
      : currentFilter === 'active'
      ? 'No active tasks! You are all caught up 🎉'
      : 'No tasks found 📝 Add one above!';
    taskList.appendChild(emptyLi);
  } else {
    filtered.forEach(task => {
      const li = document.createElement('li');
      if (task.completed) li.classList.add('completed');

      const taskTitle = document.createElement('span');
      taskTitle.className = 'task-title-text';
      taskTitle.textContent = task.text;

      const actionGroup = document.createElement('div');
      actionGroup.className = 'task-action-group';

      const p = task.priority || 'medium';
      const badge = document.createElement('span');
      badge.className = `priority-badge ${p}`;
      badge.textContent = p === 'high' ? '🔴 High' : p === 'medium' ? '🟡 Med' : '🔵 Low';

      const completeBtn = document.createElement('button');
      completeBtn.textContent = task.completed ? 'Undo' : 'Complete';
      completeBtn.className = 'complete-btn';
      completeBtn.addEventListener('click', async () => {
        if (!currentUser) {
          showMessage('Sign in with Google to manage tasks.', 'error');
          return;
        }
        const newState = !task.completed;
        await updateTaskCompletion(currentUser.uid, task.id, newState);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', async () => {
        if (!currentUser) {
          showMessage('Sign in to delete tasks.', 'error');
          return;
        }
        await deleteTask(currentUser.uid, task.id);
      });

      actionGroup.appendChild(badge);
      actionGroup.appendChild(completeBtn);
      actionGroup.appendChild(deleteBtn);

      li.appendChild(taskTitle);
      li.appendChild(actionGroup);

      taskList.appendChild(li);
    });
  }

  if (statsBar) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    statsBar.textContent = `Total: ${total} • Active: ${active} • Completed: ${completed}`;
  }
}

// ---------------------------------------------------------
// 9. Filter Buttons & Search Bar Setup
// ---------------------------------------------------------
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) return;

    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter || 'all';

    if (taskList) {
      taskList.classList.add('switching');
      setTimeout(() => {
        renderTasks();
        requestAnimationFrame(() => {
          taskList.classList.remove('switching');
        });
      }, 80);
    } else {
      renderTasks();
    }
  });
});

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTasks();
  });
}

// Expandable Search Icon Toggle Logic
const searchExpandableWrapper = document.getElementById('searchExpandableWrapper');
const searchToggleBtn          = document.getElementById('searchToggleBtn');
const searchCloseBtn           = document.getElementById('searchCloseBtn');

if (searchToggleBtn && searchExpandableWrapper && searchInput) {
  searchToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    searchExpandableWrapper.classList.add('expanded');
    setTimeout(() => searchInput.focus(), 120);
  });

  if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      searchInput.value = '';
      searchQuery = '';
      searchExpandableWrapper.classList.remove('expanded');
      renderTasks();
    });
  }

  document.addEventListener('click', (e) => {
    if (searchExpandableWrapper && !searchExpandableWrapper.contains(e.target)) {
      if (!searchInput.value || searchInput.value.trim() === '') {
        searchExpandableWrapper.classList.remove('expanded');
      }
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchQuery = '';
      searchExpandableWrapper.classList.remove('expanded');
      renderTasks();
    }
  });
}

// ---------------------------------------------------------
// 9.5 Custom Glassmorphic Priority Dropdown Component
// ---------------------------------------------------------
const customPriorityWrapper  = document.getElementById('customPriorityWrapper');
const customPriorityTrigger  = document.getElementById('customPriorityTrigger');
const customPriorityDropdown = document.getElementById('customPriorityDropdown');
const customPriorityLabel    = document.getElementById('customPriorityLabel');
const customOptionItems       = document.querySelectorAll('#customPriorityDropdown .custom-option-item');

if (customPriorityTrigger && customPriorityDropdown) {
  customPriorityTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = customPriorityDropdown.classList.contains('open');
    if (isOpen) {
      customPriorityDropdown.classList.remove('open');
      customPriorityWrapper.classList.remove('active');
      customPriorityTrigger.setAttribute('aria-expanded', 'false');
    } else {
      customPriorityDropdown.classList.add('open');
      customPriorityWrapper.classList.add('active');
      customPriorityTrigger.setAttribute('aria-expanded', 'true');
    }
  });

  customOptionItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = item.dataset.value;
      const dotSpan = item.querySelector('.option-dot');
      const textSpan = item.querySelector('.option-text');
      const labelText = `${dotSpan ? dotSpan.textContent : ''} ${textSpan ? textSpan.textContent : ''}`.trim();

      if (prioritySelect) {
        prioritySelect.value = val;
      }

      if (customPriorityLabel) {
        customPriorityLabel.textContent = labelText;
      }

      customOptionItems.forEach(opt => opt.classList.remove('selected'));
      item.classList.add('selected');

      customPriorityDropdown.classList.remove('open');
      customPriorityWrapper.classList.remove('active');
      customPriorityTrigger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (customPriorityWrapper && !customPriorityWrapper.contains(e.target)) {
      customPriorityDropdown.classList.remove('open');
      customPriorityWrapper.classList.remove('active');
      customPriorityTrigger.setAttribute('aria-expanded', 'false');
    }
  });
}

// ---------------------------------------------------------
// 10. Add Task Handler (With Priority Support)
// ---------------------------------------------------------
if (addTaskBtn && taskInput) {
  addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    const priority = prioritySelect ? prioritySelect.value : 'medium';
    if (!text) {
      showMessage('Please enter a task.', 'error');
      return;
    }
    if (!currentUser) {
      showMessage('Sign in with Google to save tasks.', 'error');
      return;
    }
    try {
      await addTaskToUser(currentUser.uid, text, priority);
      taskInput.value = '';
    } catch (err) {
      console.error('Error adding task:', err);
      showMessage('Could not add task.', 'error');
    }
  });

  taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTaskBtn.click();
  });
}

// ---------------------------------------------------------
// 11. Clear All Button
// ---------------------------------------------------------
if (clearAllBtn) {
  clearAllBtn.addEventListener('click', async () => {
    if (!currentUser) {
      showMessage('Sign in to clear tasks.', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete all tasks?')) return;
    try {
      await clearAllTasks(currentUser.uid);
      showMessage('All tasks cleared.');
    } catch (err) {
      console.error('Error clearing tasks:', err);
      showMessage('Could not clear tasks.', 'error');
    }
  });
}

// ---------------------------------------------------------
// 12. Dark Mode Theme Engine
// ---------------------------------------------------------
function applySavedTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}
applySavedTheme();

if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

// ---------------------------------------------------------
// 13. Scroll To Top Button
// ---------------------------------------------------------
window.addEventListener('scroll', () => {
  if (!scrollToTopBtn) return;
  const show = document.documentElement.scrollTop > 200;
  scrollToTopBtn.classList.toggle('show', show);
});

if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---------------------------------------------------------
// 14. Motivational Quotes Engine
// ---------------------------------------------------------
const quotes = [
  "Small steps every day lead to big results.",
  "Done is better than perfect.",
  "You don’t have to be great to start, but you have to start to be great.",
  "Focus on the next task, not the whole mountain.",
  "Progress, not perfection.",
  "One small task now makes tomorrow easier.",
  "You’re one focused session away from feeling proud of yourself.",
  "If it takes less than 2 minutes, do it now.",
  "Slow progress is still progress.",
  "Discipline beats motivation.",
  "Your future self is watching what you do today.",
  "Action cures overthinking.",
  "Clarity comes from doing, not from thinking.",
  "Win the day by winning the next 10 minutes.",
  "You don’t need more time, you need more focus.",
  "Tiny habits, big impact.",
  "Don’t break the chain—do one tiny thing today.",
  "A finished small task is better than a perfect idea in your head.",
  "The best time to start was yesterday. The next best time is now.",
  "Momentum is built, not found."
];

function showRandomQuote() {
  if (!quoteElement) return;
  const idx = Math.floor(Math.random() * quotes.length);
  quoteElement.textContent = `“${quotes[idx]}”`;
}
showRandomQuote();

// ---------------------------------------------------------
// 15. Footer Email Copy
// ---------------------------------------------------------
if (copyEmailBtnFooter && emailAddressFooter) {
  copyEmailBtnFooter.addEventListener('click', async () => {
    const email = emailAddressFooter.textContent.trim();
    try {
      await navigator.clipboard.writeText(email);
      const originalText = copyEmailBtnFooter.textContent;
      copyEmailBtnFooter.textContent = 'Copied! ✓';
      showMessage('Email copied to clipboard.');
      setTimeout(() => {
        copyEmailBtnFooter.textContent = originalText;
      }, 2000);
    } catch {
      showMessage('Could not copy email.', 'error');
    }
  });
}

// ---------------------------------------------------------
// 16. Google Authentication Flow (Speed Suite Optimization)
// ---------------------------------------------------------
const provider = new firebase.auth.GoogleAuthProvider();

function setGoogleLoginBtnLoading(isLoading) {
  if (!googleLoginBtn) return;
  if (isLoading) {
    googleLoginBtn.classList.add('loading');
    googleLoginBtn.innerHTML = `
      <span class="auth-spinner"></span>
      <span>Connecting to Google...</span>
    `;
  } else {
    googleLoginBtn.classList.remove('loading');
    googleLoginBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.24 10.285V13.4h6.887C18.2 15.684 15.65 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.55 0 2.92.585 3.96 1.545l2.4-2.4C16.89 3.51 14.7 2.685 12.24 2.685 7.14 2.685 3 6.825 3 11.925s4.14 9.24 9.24 9.24c5.34 0 8.865-3.75 8.865-9.015 0-.645-.06-1.245-.165-1.865h-8.7z"/>
      </svg>
      Sign in with Google
    `;
  }
}

if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    if (window.location.protocol === 'file:') {
      showMessage('Google Sign-In requires a web server (http://localhost or Live Server).', 'error');
      console.warn('Firebase Auth does not support file:// protocol. Please serve using Live Server or host online.');
      return;
    }

    setGoogleLoginBtnLoading(true);

    try {
      const result = await auth.signInWithPopup(provider);
      if (result && result.user) {
        // Preserve custom popup name if set by user, otherwise fallback to Google name
        const userName = getLocalName() || result.user.displayName || result.user.email.split('@')[0];
        saveLocalName(userName);
        updateGreeting(userName);
        localStorage.setItem('userSessionActive', 'true');
        showMessage(`Welcome, ${userName}! Signed in with Google.`);
      }
    } catch (err) {
      console.error('Google sign-in error:', err.code, err.message);
      if (err.code === 'auth/operation-not-supported-in-this-environment') {
        showMessage('Google Sign-In requires a web server (http://localhost or Live Server).', 'error');
      } else if (err.code === 'auth/unauthorized-domain') {
        showMessage('This domain is not authorized in Firebase Console.', 'error');
      } else if (err.code === 'auth/popup-blocked') {
        showMessage('Sign-in popup was blocked by browser. Please allow popups.', 'error');
      } else if (err.code === 'auth/popup-closed-by-user') {
        showMessage('Sign-in popup was closed.', 'info');
      } else {
        showMessage(`Sign-in failed: ${err.message}`, 'error');
      }
    } finally {
      setGoogleLoginBtnLoading(false);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
      currentUser = null;
      tasks = [];
      renderTasks();
      localStorage.removeItem('userSessionActive');
      
      const savedName = getLocalName();
      if (savedName) {
        updateGreeting(savedName);
      } else {
        updateGreeting('');
      }

      if (googleLoginBtn) googleLoginBtn.style.display = 'inline-flex';
      if (logoutBtn)      logoutBtn.style.display = 'none';

      showMessage('You are signed out.');
    } catch (err) {
      console.error('Error signing out:', err);
      showMessage('Error while signing out.', 'error');
    }
  });
}

// ---------------------------------------------------------
// 17. Auth Observer & App Launch Initialization (Zero-Flicker)
// ---------------------------------------------------------
auth.onAuthStateChanged(async (user) => {
  currentUser = user;

  if (user) {
    if (googleLoginBtn) googleLoginBtn.style.display = 'none';
    if (logoutBtn)      logoutBtn.style.display = 'inline-flex';

    // Preserve custom popup name if set, otherwise fallback to Google name
    const savedName = getLocalName() || user.displayName || 'Friend';
    saveLocalName(savedName);
    updateGreeting(savedName);
    localStorage.setItem('userSessionActive', 'true');

    await loadTasksForUser(user.uid);
  } else {
    if (googleLoginBtn) googleLoginBtn.style.display = 'inline-flex';
    if (logoutBtn)      logoutBtn.style.display = 'none';

    tasks = [];
    renderTasks();

    const savedName = getLocalName();
    if (savedName) {
      updateGreeting(savedName);
    } else {
      updateGreeting('');
    }
  }

  setGoogleLoginBtnLoading(false);
});

// Google One-Tap 1-Click Fast Authentication Initialization
function tryGoogleOneTap() {
  if (window.google && google.accounts && google.accounts.id) {
    try {
      google.accounts.id.initialize({
        client_id: "685947792786-e49cf23e4a977c4c0be54b.apps.googleusercontent.com",
        callback: async (res) => {
          if (res && res.credential) {
            setGoogleLoginBtnLoading(true);
            const cred = firebase.auth.GoogleAuthProvider.credential(res.credential);
            const userCred = await auth.signInWithCredential(cred);
            if (userCred && userCred.user) {
              // Preserve custom popup name if set
              const userName = getLocalName() || userCred.user.displayName || userCred.user.email.split('@')[0];
              saveLocalName(userName);
              updateGreeting(userName);
              localStorage.setItem('userSessionActive', 'true');
              showMessage(`Welcome, ${userName}! Signed in instantly with 1-Tap.`);
            }
            setGoogleLoginBtnLoading(false);
          }
        }
      });
      if (!currentUser && !localStorage.getItem('userSessionActive')) {
        google.accounts.id.prompt();
      }
    } catch (e) {
      console.warn('Google One-Tap notice:', e);
    }
  }
}

window.addEventListener('load', () => {
  const savedName = getLocalName();
  if (savedName) {
    updateGreeting(savedName);
  } else {
    updateGreeting('');
    openWelcomeModal();
  }
  renderTasks();
  setTimeout(tryGoogleOneTap, 1000);
});

// ---------------------------------------------------------
// 18. Smart Features Collapsible Drawer Toggle
// ---------------------------------------------------------
const toggleFeaturesBtn = document.getElementById('toggleFeaturesBtn');
const featuresContent    = document.getElementById('featuresContent');

if (toggleFeaturesBtn && featuresContent) {
  toggleFeaturesBtn.addEventListener('click', () => {
    const isExpanded = toggleFeaturesBtn.classList.toggle('expanded');
    featuresContent.classList.toggle('open');
    toggleFeaturesBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  });
}

// ---------------------------------------------------------
// 19. Progressive Web App (PWA) & In-App Installation Flow
// ---------------------------------------------------------
let deferredPrompt;
const pwaInstallBtn = document.getElementById('pwaInstallBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (pwaInstallBtn) {
    pwaInstallBtn.style.display = 'inline-flex';
  }
});

if (pwaInstallBtn) {
  pwaInstallBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        pwaInstallBtn.style.display = 'none';
        showMessage('TaskCraft Pro installed successfully! 🎉');
      }
      deferredPrompt = null;
    }
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('TaskCraft Pro PWA Service Worker registered:', reg.scope);
        reg.update();
      })
      .catch(err => console.warn('PWA Service Worker registration failed:', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}


