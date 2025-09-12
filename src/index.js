const express = require("express");
const path = require("path");
const app = express();

const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// CORS middleware for frontend integration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// In-memory database for tasks
let tasks = [
  {
    id: 1,
    title: "Setup Docker Environment",
    description: "Configure Docker for the Node.js application",
    status: "completed",
    priority: "high",
    createdAt: "2025-09-12T10:00:00Z",
    updatedAt: "2025-09-12T10:30:00Z",
    dueDate: "2025-09-15T23:59:59Z"
  },
  {
    id: 2,
    title: "Implement CRUD API",
    description: "Create RESTful API with full CRUD operations",
    status: "in-progress",
    priority: "high",
    createdAt: "2025-09-12T11:00:00Z",
    updatedAt: "2025-09-12T11:00:00Z",
    dueDate: "2025-09-16T23:59:59Z"
  },
  {
    id: 3,
    title: "Write Documentation",
    description: "Document all API endpoints and usage examples",
    status: "pending",
    priority: "medium",
    createdAt: "2025-09-12T12:00:00Z",
    updatedAt: "2025-09-12T12:00:00Z",
    dueDate: "2025-09-17T23:59:59Z"
  }
];

let nextId = 4;

// Validation functions
const validateTask = (task) => {
  const errors = [];
  
  if (!task.title || task.title.trim().length === 0) {
    errors.push("Title is required");
  }
  
  if (task.title && task.title.length > 100) {
    errors.push("Title must be less than 100 characters");
  }
  
  if (task.description && task.description.length > 500) {
    errors.push("Description must be less than 500 characters");
  }
  
  if (task.status && !['pending', 'in-progress', 'completed', 'cancelled'].includes(task.status)) {
    errors.push("Status must be one of: pending, in-progress, completed, cancelled");
  }
  
  if (task.priority && !['low', 'medium', 'high', 'urgent'].includes(task.priority)) {
    errors.push("Priority must be one of: low, medium, high, urgent");
  }
  
  return errors;
};

// Routes

// Serve the main frontend application
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// API Documentation endpoint  
app.get("/api", (req, res) => {
  res.json({
    application: "📋 Task Management CRUD API",
    version: "1.0.0",
    description: "Complete CRUD operations for task management with web interface",
    author: "Docker Assignment",
    frontend: "Available at GET /",
    endpoints: {
      "GET /": "Web Application Interface",
      "GET /api": "API Documentation",
      "GET /health": "Health check with system information",
      "GET /api/stats": "Application statistics",
      "GET /api/tasks": "Get all tasks (supports filtering)",
      "GET /api/tasks/:id": "Get task by ID",
      "POST /api/tasks": "Create new task",
      "PUT /api/tasks/:id": "Update task completely",
      "PATCH /api/tasks/:id": "Update task partially",
      "DELETE /api/tasks/:id": "Delete task"
    },
    queryParameters: {
      "/api/tasks": {
        "status": "Filter by status (pending, in-progress, completed, cancelled)",
        "priority": "Filter by priority (low, medium, high, urgent)",
        "search": "Search in title and description",
        "sortBy": "Sort by field (title, createdAt, updatedAt, priority)",
        "order": "Sort order (asc, desc)"
      }
    },
    taskStructure: {
      "id": "number (auto-generated)",
      "title": "string (required, max 100 chars)",
      "description": "string (optional, max 500 chars)",
      "status": "string (pending|in-progress|completed|cancelled)",
      "priority": "string (low|medium|high|urgent)",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string",
      "dueDate": "ISO date string (optional)"
    },
    examples: {
      "createTask": {
        "title": "Learn Docker",
        "description": "Master Docker containerization",
        "status": "pending",
        "priority": "high",
        "dueDate": "2025-09-20T23:59:59Z"
      }
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: "1.0.0",
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      }
    },
    database: {
      totalTasks: tasks.length,
      tasksByStatus: {
        pending: tasks.filter(t => t.status === 'pending').length,
        'in-progress': tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length
      }
    }
  });
});

// Application statistics
app.get("/api/stats", (req, res) => {
  const now = new Date();
  const overdueTasks = tasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
  );
  
  res.json({
    success: true,
    data: {
      totalTasks: tasks.length,
      statusBreakdown: {
        pending: tasks.filter(t => t.status === 'pending').length,
        'in-progress': tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length
      },
      priorityBreakdown: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        urgent: tasks.filter(t => t.priority === 'urgent').length
      },
      overdueTasks: overdueTasks.length,
      completionRate: tasks.length > 0 ? 
        Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
    }
  });
});

// GET all tasks with filtering and sorting
app.get("/api/tasks", (req, res) => {
  let filteredTasks = [...tasks];
  const { status, priority, search, sortBy, order } = req.query;
  
  // Filter by status
  if (status) {
    filteredTasks = filteredTasks.filter(task => 
      task.status.toLowerCase() === status.toLowerCase()
    );
  }
  
  // Filter by priority
  if (priority) {
    filteredTasks = filteredTasks.filter(task => 
      task.priority.toLowerCase() === priority.toLowerCase()
    );
  }
  
  // Search in title and description
  if (search) {
    const searchLower = search.toLowerCase();
    filteredTasks = filteredTasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) ||
      (task.description && task.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Sort tasks
  if (sortBy) {
    const sortOrder = order === 'desc' ? -1 : 1;
    filteredTasks.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'priority') {
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
      }
      
      if (aValue < bValue) return -1 * sortOrder;
      if (aValue > bValue) return 1 * sortOrder;
      return 0;
    });
  }
  
  res.json({
    success: true,
    count: filteredTasks.length,
    total: tasks.length,
    filters: { status, priority, search, sortBy, order },
    data: filteredTasks
  });
});

// GET task by ID
app.get("/api/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      message: `Task with ID ${taskId} not found`
    });
  }
  
  res.json({
    success: true,
    data: task
  });
});

// CREATE new task
app.post("/api/tasks", (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;
  
  // Validate input
  const errors = validateTask(req.body);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }
  
  const now = new Date().toISOString();
  const newTask = {
    id: nextId++,
    title: title.trim(),
    description: description ? description.trim() : "",
    status: status || "pending",
    priority: priority || "medium",
    createdAt: now,
    updatedAt: now,
    dueDate: dueDate || null
  };
  
  tasks.push(newTask);
  
  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: newTask
  });
});

// UPDATE task completely (PUT)
app.put("/api/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Task with ID ${taskId} not found`
    });
  }
  
  // Validate input
  const errors = validateTask(req.body);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }
  
  const { title, description, status, priority, dueDate } = req.body;
  const originalTask = tasks[taskIndex];
  
  tasks[taskIndex] = {
    ...originalTask,
    title: title.trim(),
    description: description ? description.trim() : "",
    status: status || "pending",
    priority: priority || "medium",
    updatedAt: new Date().toISOString(),
    dueDate: dueDate || null
  };
  
  res.json({
    success: true,
    message: "Task updated successfully",
    data: tasks[taskIndex]
  });
});

// UPDATE task partially (PATCH)
app.patch("/api/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Task with ID ${taskId} not found`
    });
  }
  
  const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate'];
  const updates = {};
  
  // Only include allowed fields that are present in request
  allowedFields.forEach(field => {
    if (req.body.hasOwnProperty(field)) {
      updates[field] = req.body[field];
    }
  });
  
  // Validate updates
  const errors = validateTask({ ...tasks[taskIndex], ...updates });
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }
  
  // Apply updates
  Object.keys(updates).forEach(key => {
    if (key === 'title' || key === 'description') {
      tasks[taskIndex][key] = updates[key] ? updates[key].trim() : updates[key];
    } else {
      tasks[taskIndex][key] = updates[key];
    }
  });
  
  tasks[taskIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: "Task updated successfully",
    data: tasks[taskIndex],
    updated: Object.keys(updates)
  });
});

// DELETE task
app.delete("/api/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Task with ID ${taskId} not found`
    });
  }
  
  const deletedTask = tasks.splice(taskIndex, 1)[0];
  
  res.json({
    success: true,
    message: "Task deleted successfully",
    data: deletedTask
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err);
  
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.path} not found`,
    suggestion: "Visit GET / for API documentation"
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Task Management CRUD API running on http://0.0.0.0:${PORT}`);
  console.log(`📚 API Documentation: http://0.0.0.0:${PORT}/`);
  console.log(`🏥 Health Check: http://0.0.0.0:${PORT}/health`);
  console.log(`📊 Statistics: http://0.0.0.0:${PORT}/api/stats`);
  console.log(`📋 Tasks API: http://0.0.0.0:${PORT}/api/tasks`);
  console.log(`⚡ Ready to accept requests!`);
});

