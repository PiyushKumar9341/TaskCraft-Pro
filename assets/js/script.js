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

function getPopupAiMessage(name) {
  const hour = new Date().getHours();
  let advice = 'Let’s start with one solid win.';

  if (hour >= 5 && hour < 12) {
    advice = 'Ready to conquer your day?';
  } else if (hour >= 12 && hour < 17) {
    advice = 'Pick a task and keep your momentum going.';
  } else if (hour >= 17 && hour < 22) {
    advice = 'Wrap up your day with one solid win.';
  } else {
    advice = 'A small step tonight makes tomorrow easier.';
  }

  const cleanName = name && name.trim() ? name.trim() : '';
  return cleanName ? `${cleanName}, ${advice}` : `Wrap up your day with one solid win.`;
}

function updateModalHeading() {
  const heading = document.getElementById('welcomeModalHeading');
  if (!heading) return;
  const currentName = userNameInput ? userNameInput.value.trim() : '';
  heading.textContent = getPopupAiMessage(currentName);
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

// ---------------------------------------------------------
// 6. AI Welcome Modal Handlers
// ---------------------------------------------------------
function openWelcomeModal() {
  if (!welcomeOverlay) return;
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

async function addTaskToUser(uid, text) {
  if (!uid) return;
  const colRef = getTasksCollectionRef(uid);
  const docRef = await colRef.add({
    text,
    completed: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  tasks.push({ id: docRef.id, text, completed: false });
  renderTasks();
}

async function updateTaskCompletion(uid, taskId, completed) {
  if (!uid) return;
  const colRef = getTasksCollectionRef(uid);
  await colRef.doc(taskId).update({ completed });
  const t = tasks.find(t => t.id === taskId);
  if (t) t.completed = completed;
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
// 8. Render Task List & Stats Bar
// ---------------------------------------------------------
function renderTasks() {
  if (!taskList) return;
  taskList.innerHTML = '';

  let filtered = tasks;
  if (currentFilter === 'active') {
    filtered = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = tasks.filter(t => t.completed);
  }

  filtered.forEach(task => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    const span = document.createElement('span');
    span.textContent = task.text;

    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'flex space-x-2';

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

    btnWrapper.appendChild(completeBtn);
    btnWrapper.appendChild(deleteBtn);

    li.appendChild(span);
    li.appendChild(btnWrapper);

    taskList.appendChild(li);
  });

  if (statsBar) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    statsBar.textContent = `Total: ${total} • Active: ${active} • Completed: ${completed}`;
  }
}

// ---------------------------------------------------------
// 9. Filter Buttons Setup
// ---------------------------------------------------------
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter || 'all';
    renderTasks();
  });
});

// ---------------------------------------------------------
// 10. Add Task Handler
// ---------------------------------------------------------
if (addTaskBtn && taskInput) {
  addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    if (!text) {
      showMessage('Please enter a task.', 'error');
      return;
    }
    if (!currentUser) {
      showMessage('Sign in with Google to save tasks.', 'error');
      return;
    }
    try {
      await addTaskToUser(currentUser.uid, text);
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
// 16. Google Authentication Flow
// ---------------------------------------------------------
const provider = new firebase.auth.GoogleAuthProvider();

if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    if (window.location.protocol === 'file:') {
      showMessage('Google Sign-In requires a web server (http://localhost or Live Server).', 'error');
      console.warn('Firebase Auth does not support file:// protocol. Please serve using Live Server or host online.');
      return;
    }

    try {
      const result = await auth.signInWithPopup(provider);
      if (result && result.user) {
        const userName = result.user.displayName || result.user.email.split('@')[0];
        saveLocalName(userName);
        updateGreeting(userName);
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
      clearLocalName();
      updateGreeting('');

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
// 17. Auth Observer & App Launch Initialization
// ---------------------------------------------------------
auth.onAuthStateChanged(async (user) => {
  currentUser = user;

  if (user) {
    if (googleLoginBtn) googleLoginBtn.style.display = 'none';
    if (logoutBtn)      logoutBtn.style.display = 'inline-block';

    const savedName = getLocalName() || user.displayName || 'Friend';
    saveLocalName(savedName);
    updateGreeting(savedName);

    await loadTasksForUser(user.uid);
  } else {
    if (googleLoginBtn) googleLoginBtn.style.display = 'inline-flex';
    if (logoutBtn)      logoutBtn.style.display = 'none';

    tasks = [];
    renderTasks();
    clearLocalName();
    updateGreeting('');
  }
});

window.addEventListener('load', () => {
  const savedName = getLocalName();
  if (savedName) {
    updateGreeting(savedName);
  } else {
    updateGreeting('');
    openWelcomeModal();
  }
  renderTasks();
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
