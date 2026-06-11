// ===== CONFIGURATION =====
// Backend API URL - change this when deploying to Render
const API_URL = 'https://todo-app-backend-2m6f.onrender.com/api';

// ===== ON PAGE LOAD =====
// When page opens, fetch all todos from backend
document.addEventListener('DOMContentLoaded', () => {
  fetchTodos();
  
  // Add event listener to "Add Todo" button
  document.getElementById('addBtn').addEventListener('click', addTodo);
  
  // Allow pressing Enter to add todo
  document.getElementById('todoInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
  });
});

// ===== FETCH ALL TODOS =====
// GET request to backend to get all todos
async function fetchTodos() {
  try {
    // Call backend GET /todos endpoint
    const response = await fetch(`${API_URL}/todos`);
    const todos = await response.json();
    
    // Clear the list and display todos
    displayTodos(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
  }
}

// ===== DISPLAY TODOS ON PAGE =====
// Shows all todos as list items with delete/complete buttons
function displayTodos(todos) {
  const todoList = document.getElementById('todoList');
  todoList.innerHTML = ''; // Clear previous list
  
  // Loop through each todo and create HTML
  todos.forEach(todo => {
    const li = document.createElement('li');
    
    // Style completed todos with strikethrough
    if (todo.completed) {
      li.style.textDecoration = 'line-through';
      li.style.opacity = '0.6';
    }
    
    // Create HTML for each todo item
    li.innerHTML = `
      <span>${todo.text}</span>
      <button onclick="toggleTodo('${todo._id}')">Done</button>
      <button onclick="deleteTodo('${todo._id}')">Delete</button>
    `;
    
    todoList.appendChild(li);
  });
}

// ===== ADD NEW TODO =====
// POST request to backend to create new todo
async function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();
  
  // Validate: text must not be empty
  if (!text) {
    alert('Please enter a todo');
    return;
  }
  
  try {
    // Call backend POST /todos endpoint
    const response = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Send the todo text
      body: JSON.stringify({ text })
    });
    
    const newTodo = await response.json();
    
    // Clear input field
    input.value = '';
    
    // Refresh the todo list
    fetchTodos();
  } catch (error) {
    console.error('Error adding todo:', error);
  }
}

// ===== TOGGLE TODO (Mark as Done) =====
// PATCH request to backend to toggle completed status
async function toggleTodo(id) {
  try {
    // Call backend PATCH /todos/:id endpoint
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Refresh the todo list
    fetchTodos();
  } catch (error) {
    console.error('Error toggling todo:', error);
  }
}

// ===== DELETE TODO =====
// DELETE request to backend to remove todo
async function deleteTodo(id) {
  try {
    // Call backend DELETE /todos/:id endpoint
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE'
    });
    
    // Refresh the todo list
    fetchTodos();
  } catch (error) {
    console.error('Error deleting todo:', error);
  }
}