// Global variables
let tasks = [];
let editingTaskId = null;
let currentFilters = {};

// API Base URL
const API_BASE = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadTasks();
    loadStats();
});

// Initialize the application
function initializeApp() {
    console.log('🚀 Task Management App initialized');
    
    // Set minimum date for due date input to today
    const dueDateInput = document.getElementById('dueDate');
    const today = new Date();
    const todayString = today.toISOString().slice(0, 16);
    dueDateInput.min = todayString;
}

// Setup event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('taskForm').addEventListener('submit', handleFormSubmit);
    
    // Cancel editing
    document.getElementById('cancelBtn').addEventListener('click', cancelEditing);
    
    // Filter and search
    document.getElementById('filterStatus').addEventListener('change', applyFilters);
    document.getElementById('filterPriority').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('sortBy').addEventListener('change', applyFilters);
    document.getElementById('sortOrder').addEventListener('change', applyFilters);
    
    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Refresh tasks
    document.getElementById('refreshTasks').addEventListener('click', function() {
        loadTasks();
        loadStats();
        showToast('Tasks refreshed!', 'info');
    });
}

// Handle form submission (Create/Update)
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const taskData = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        status: formData.get('status'),
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate') || null
    };
    
    try {
        if (editingTaskId) {
            await updateTask(editingTaskId, taskData);
        } else {
            await createTask(taskData);
        }
        
        resetForm();
        loadTasks();
        loadStats();
        
    } catch (error) {
        console.error('Error submitting form:', error);
        showToast('Error saving task. Please try again.', 'error');
    }
}

// Create new task
async function createTask(taskData) {
    const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create task');
    }
    
    const result = await response.json();
    showToast('Task created successfully!', 'success');
    return result;
}

// Update existing task
async function updateTask(id, taskData) {
    const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update task');
    }
    
    const result = await response.json();
    showToast('Task updated successfully!', 'success');
    return result;
}

// Delete task
async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete task');
        }
        
        showToast('Task deleted successfully!', 'success');
        loadTasks();
        loadStats();
        
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Error deleting task. Please try again.', 'error');
    }
}

// Load all tasks
async function loadTasks() {
    showLoading(true);
    
    try {
        const queryParams = new URLSearchParams(currentFilters);
        const response = await fetch(`/api/tasks?${queryParams}`);
        
        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }
        
        const result = await response.json();
        tasks = result.data;
        renderTasks(tasks);
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        showToast('Error loading tasks. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
            throw new Error('Failed to load statistics');
        }
        
        const result = await response.json();
        updateStatsDisplay(result.data);
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update statistics display
function updateStatsDisplay(stats) {
    document.getElementById('totalTasks').textContent = stats.totalTasks;
    document.getElementById('pendingTasks').textContent = stats.statusBreakdown.pending;
    document.getElementById('inProgressTasks').textContent = stats.statusBreakdown['in-progress'];
    document.getElementById('completedTasks').textContent = stats.statusBreakdown.completed;
}

// Render tasks to the UI
function renderTasks(tasks) {
    const tasksGrid = document.getElementById('tasksGrid');
    const noTasks = document.getElementById('noTasks');
    
    if (tasks.length === 0) {
        tasksGrid.innerHTML = '';
        noTasks.style.display = 'block';
        return;
    }
    
    noTasks.style.display = 'none';
    
    tasksGrid.innerHTML = tasks.map(task => `
        <div class="task-card" data-task-id="${task.id}">
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <div class="task-actions">
                    <button class="btn btn-warning btn-small" onclick="editTask(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            
            <div class="task-meta">
                <div class="task-meta-item">
                    <i class="fas fa-flag"></i>
                    <span class="status-badge status-${task.status}">${task.status}</span>
                </div>
                <div class="task-meta-item">
                    <i class="fas fa-exclamation"></i>
                    <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                </div>
            </div>
            
            <div class="task-dates">
                <div><i class="fas fa-plus"></i> Created: ${formatDate(task.createdAt)}</div>
                <div><i class="fas fa-edit"></i> Updated: ${formatDate(task.updatedAt)}</div>
                ${task.dueDate ? `<div><i class="fas fa-calendar"></i> Due: ${formatDate(task.dueDate)}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// Edit task
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    editingTaskId = id;
    
    // Populate form
    document.getElementById('taskId').value = task.id;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description || '';
    document.getElementById('status').value = task.status;
    document.getElementById('priority').value = task.priority;
    
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        document.getElementById('dueDate').value = dueDate.toISOString().slice(0, 16);
    }
    
    // Update form UI
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Task';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Update Task';
    document.getElementById('cancelBtn').style.display = 'inline-flex';
    
    // Scroll to form
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

// Cancel editing
function cancelEditing() {
    resetForm();
}

// Reset form
function resetForm() {
    editingTaskId = null;
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Task';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Create Task';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Apply filters
function applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const priority = document.getElementById('filterPriority').value;
    const search = document.getElementById('searchInput').value;
    const sortBy = document.getElementById('sortBy').value;
    const order = document.getElementById('sortOrder').value;
    
    currentFilters = {};
    
    if (status) currentFilters.status = status;
    if (priority) currentFilters.priority = priority;
    if (search) currentFilters.search = search;
    if (sortBy) currentFilters.sortBy = sortBy;
    if (order) currentFilters.order = order;
    
    loadTasks();
}

// Clear filters
function clearFilters() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterPriority').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('sortBy').value = 'createdAt';
    document.getElementById('sortOrder').value = 'desc';
    
    currentFilters = {};
    loadTasks();
    showToast('Filters cleared!', 'info');
}

// Show/hide loading state
function showLoading(show) {
    const loading = document.getElementById('loading');
    const tasksGrid = document.getElementById('tasksGrid');
    
    if (show) {
        loading.style.display = 'block';
        tasksGrid.style.opacity = '0.5';
    } else {
        loading.style.display = 'none';
        tasksGrid.style.opacity = '1';
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility functions

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Quick actions for status updates
function quickUpdateStatus(taskId, newStatus) {
    updateTask(taskId, { status: newStatus })
        .then(() => {
            loadTasks();
            loadStats();
        })
        .catch(error => {
            console.error('Error updating status:', error);
            showToast('Error updating task status', 'error');
        });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N for new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        resetForm();
        document.getElementById('title').focus();
    }
    
    // Escape to cancel editing
    if (e.key === 'Escape' && editingTaskId) {
        cancelEditing();
    }
    
    // Ctrl/Cmd + R for refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        loadTasks();
        loadStats();
        showToast('Tasks refreshed!', 'info');
    }
});

// Auto-refresh every 30 seconds
setInterval(() => {
    loadStats();
}, 30000);

console.log('📋 Task Management App ready! Keyboard shortcuts:');
console.log('- Ctrl/Cmd + N: New task');
console.log('- Escape: Cancel editing');
console.log('- Ctrl/Cmd + R: Refresh tasks');
