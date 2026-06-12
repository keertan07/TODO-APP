//const API_URL = 'http://localhost:5000/api';
//const AUTH_URL = 'http://localhost:5000';

// Updated URLs to deployed backend (p2)
const API_URL = 'https://todo-app-backend-2m6f.onrender.com/api';
const AUTH_URL = 'https://todo-app-backend-2m6f.onrender.com';

// ===== TOKEN MANAGEMENT =====
// When Google redirects back, token is in the URL
// Save it to localStorage then clean the URL
function getToken() {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  if (urlToken) {
    localStorage.setItem('token', urlToken);
    window.history.replaceState({}, '', window.location.pathname);//This cleans the token from the URL but stays on the same page instead of going to root.(p2)
  }
  return localStorage.getItem('token');
}

// ===== USER STATE =====
let token = null;
let currentUser = null;

// Decode the JWT to get user info (name, photo)
// JWT is 3 parts separated by dots - middle part is the data
function parseJwt(t) {
  const base64 = t.split('.')[1];
  return JSON.parse(atob(base64));
}

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  token = getToken();

  if (!token) {
    // Not logged in - show login button
    showLoginScreen();
    return;
  }

  // Logged in - decode user info from token
  currentUser = parseJwt(token);
  showAppScreen();
  fetchTodos();

  document.getElementById('addBtn').addEventListener('click', addTodo);
  document.getElementById('todoInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
  });

  document.getElementById('logoutBtn').addEventListener('click', logout);
});

// ===== SHOW LOGIN SCREEN =====
function showLoginScreen() {
  document.getElementById('app').innerHTML = `
    <div class="login-container">
      <h1>todos</h1>
      <p>Sign in to manage your personal todos</p>
      <a href="${AUTH_URL}/auth/google" class="google-btn">
        Sign in with Google
      </a>
    </div>
  `;
}

// ===== SHOW APP SCREEN =====
function showAppScreen() {
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="header">
        <h1>todos</h1>
        <div class="user-info">
          <img src="${currentUser.photo}" alt="avatar" class="avatar"/>
          <span>${currentUser.name}</span>
          <button id="logoutBtn">logout</button>
        </div>
      </div>
      <div class="input-row">
        <input type="text" id="todoInput" placeholder="what needs to be done?" />
        <button id="addBtn">add</button>
      </div>
      <ul id="todoList"></ul>
    </div>
  `;
}

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem('token');
  window.location.reload();
}

// ===== FETCH ALL TODOS =====
async function fetchTodos() {
  try {
    const response = await fetch(`${API_URL}/todos`, {
      headers: {
        // Send token with every request so backend knows who you are
        'Authorization': `Bearer ${token}`
      }
    });
    const todos = await response.json();
    displayTodos(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
  }
}

// ===== DISPLAY TODOS =====
function displayTodos(todos) {
  const todoList = document.getElementById('todoList');
  todoList.innerHTML = '';

  todos.forEach(todo => {
    const li = document.createElement('li');
    if (todo.completed) {
      li.style.textDecoration = 'line-through';
      li.style.opacity = '0.6';
    }
    li.innerHTML = `
      <span>${todo.text}</span>
      <button onclick="toggleTodo('${todo._id}')">Done</button>
      <button onclick="deleteTodo('${todo._id}')">Delete</button>
    `;
    todoList.appendChild(li);
  });
}

// ===== ADD TODO =====
async function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();
  if (!text) return;

  try {
    await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    input.value = '';
    fetchTodos();
  } catch (error) {
    console.error('Error adding todo:', error);
  }
}

// ===== TOGGLE TODO =====
async function toggleTodo(id) {
  try {
    await fetch(`${API_URL}/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTodos();
  } catch (error) {
    console.error('Error toggling todo:', error);
  }
}

// ===== DELETE TODO =====
async function deleteTodo(id) {
  try {
    await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTodos();
  } catch (error) {
    console.error('Error deleting todo:', error);
  }
}