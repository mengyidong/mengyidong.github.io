// Local Storage Manager
class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.STORAGE_KEY = 'todos_list';
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.render();
    }

    // Local Storage Operations
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            this.todos = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.todos = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            alert('Unable to save. Your storage might be full.');
        }
    }

    // Todo Operations
    addTodo(text, priority = 'medium') {
        if (!text.trim()) {
            alert('Please enter a task!');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            priority: priority,
            createdAt: new Date().toISOString()
        };

        this.todos.push(todo);
        this.saveToStorage();
        this.render();
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveToStorage();
        this.render();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }

    editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.saveToStorage();
            this.render();
        }
    }

    clearCompleted() {
        this.todos = this.todos.filter(todo => !todo.completed);
        this.saveToStorage();
        this.render();
    }

    clearAll() {
        if (confirm('Are you sure you want to delete all tasks?')) {
            this.todos = [];
            this.saveToStorage();
            this.render();
        }
    }

    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Filtering
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    // Statistics
    getStats() {
        return {
            total: this.todos.length,
            active: this.todos.filter(todo => !todo.completed).length,
            completed: this.todos.filter(todo => todo.completed).length
        };
    }

    // Rendering
    render() {
        this.renderTodos();
        this.updateStats();
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos();

        todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.id = `todo-${todo.id}`;

            li.innerHTML = `
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    data-id="${todo.id}"
                >
                <div class="todo-content">
                    <span class="todo-text" data-id="${todo.id}">${this.escapeHtml(todo.text)}</span>
                    <span class="priority-badge priority-${todo.priority}">${todo.priority.toUpperCase()}</span>
                </div>
                <div class="todo-actions">
                    <button class="delete-btn" data-id="${todo.id}">×</button>
                </div>
            `;

            todoList.appendChild(li);
        });

        this.attachTodoListeners();
    }

    updateStats() {
        const stats = this.getStats();
        document.getElementById('totalCount').textContent = stats.total;
        document.getElementById('activeCount').textContent = stats.active;
        document.getElementById('completedCount').textContent = stats.completed;
    }

    attachTodoListeners() {
        // Checkbox listeners
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.toggleTodo(id);
            });
        });

        // Delete button listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                this.deleteTodo(id);
            });
        });

        // Edit on double-click
        document.querySelectorAll('.todo-text').forEach(text => {
            text.addEventListener('dblclick', (e) => {
                this.enableEdit(e.target);
            });
        });
    }

    enableEdit(element) {
        const id = parseInt(element.dataset.id);
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const currentText = element.textContent;
        element.innerHTML = `
            <input 
                type="text" 
                class="todo-input-edit" 
                value="${this.escapeHtml(currentText)}"
                data-id="${id}"
            >
        `;

        const input = element.querySelector('.todo-input-edit');
        input.focus();
        input.select();

        const finishEdit = () => {
            const newText = input.value;
            if (newText.trim()) {
                this.editTodo(id, newText);
            } else {
                element.textContent = currentText;
            }
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEdit();
            } else if (e.key === 'Escape') {
                element.textContent = currentText;
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Add todo
        document.getElementById('addBtn').addEventListener('click', () => {
            const input = document.getElementById('todoInput');
            this.addTodo(input.value);
            input.value = '';
            input.focus();
        });

        // Enter key on input
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('addBtn').click();
            }
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });

        // Clear completed
        document.getElementById('clearCompletedBtn').addEventListener('click', () => {
            if (this.todos.some(t => t.completed)) {
                this.clearCompleted();
            }
        });

        // Export
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportTodos();
        });

        // Clear all
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAll();
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
