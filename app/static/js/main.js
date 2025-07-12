// Add these at the top of your existing main.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize SortableJS
    const sortableList = document.getElementById('sortable-list');
    new Sortable(sortableList, {
        handle: '.handle',
        animation: 150,
        ghostClass: 'bg-light',
        onEnd: function(evt) {
            // Only update positions if the item moved within its own group
            const oldBoughtStatus = evt.from.children[evt.oldIndex].classList.contains('completed');
            const newBoughtStatus = evt.to.children[evt.newIndex].classList.contains('completed');
            
            if (oldBoughtStatus === newBoughtStatus) {
                const items = Array.from(sortableList.children).map((item, index) => {
                    return {
                        id: parseInt(item.dataset.id),
                        position: index,
                        bought: item.classList.contains('completed')
                    };
                });
                
                fetch('/update_position', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({items: items})
                });
            } else {
                // If user tried to drag between groups, revert the UI change
                setTimeout(() => {
                    const items = Array.from(sortableList.querySelectorAll('.list-group-item'));
                    items.sort((a, b) => {
                        const aBought = a.classList.contains('completed');
                        const bBought = b.classList.contains('completed');
                        if (aBought === bBought) {
                            return 0;
                        }
                        return aBought ? 1 : -1;
                    });
                    items.forEach(item => sortableList.appendChild(item));
                }, 0);
            }
        }
    });

    // Priority change handler
    document.querySelectorAll('.priority-change').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const priority = parseInt(this.dataset.priority);
            const listItem = this.closest('.list-group-item');
            const itemId = listItem.dataset.id;
            const priorityNames = {1: 'High', 2: 'Medium', 3: 'Low'};
            
            fetch(`/update_priority/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({priority: priority})
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const indicator = listItem.querySelector('.priority-indicator');
                    indicator.className = 'priority-indicator me-2 ' + 
                        (priority === 1 ? 'text-danger' : 
                        priority === 3 ? 'text-success' : 'text-warning');
                    indicator.textContent = 
                        priority === 1 ? '❗' : 
                        priority === 3 ? '⬇' : '➡';
                    showToast(`Priority set to ${priorityNames[priority]}`);
                }
            });
        });
    });

    // ... rest of your existing JavaScript ...
});

// Replace the existing delete button handler with:
document.querySelectorAll('a[href^="/delete/"]').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const itemElement = this.closest('.list-group-item');
        const itemName = itemElement.querySelector('span:not(.badge)').textContent.trim();
        
        fetch(this.getAttribute('href'), {
            method: 'GET',
        })
        .then(response => {
            if (response.ok) {
                itemElement.classList.add('fade-out');
                setTimeout(() => itemElement.remove(), 300);
                showToast(`Removed "${itemName}" from list`);
            } else {
                showToast('Failed to remove item', 'danger');
            }
        });
    });
});

// Mark all as bought functionality
document.getElementById('mark-all-bought')?.addEventListener('click', function() {
    fetch('/mark_all_bought', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update UI
            document.querySelectorAll('.list-group-item:not(.completed)').forEach(item => {
                item.classList.add('completed');
                const toggleBtn = item.querySelector('a[href^="/toggle/"]');
                if (toggleBtn) {
                    toggleBtn.classList.remove('btn-outline-primary');
                    toggleBtn.classList.add('btn-outline-success');
                    toggleBtn.textContent = '✅ Purchased';
                }
            });
            showToast(`Marked ${data.count || 'all'} items as purchased`);
        }
    })
    .catch(error => {
        showToast('Failed to mark items as purchased', 'danger');
    });
});

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = toastEl.querySelector('.toast-body');
    
    // Set message and style
    toastBody.textContent = message;
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-info');
    toastEl.classList.add(`bg-${type}`);
    
    // Show the toast
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    // Auto-hide after 3 seconds
    setTimeout(() => toast.hide(), 3000);
}

// Load frequent items when dropdown opens
document.getElementById('frequentItemsDropdown').addEventListener('click', function() {
    fetch('/frequent_items')
        .then(response => response.json())
        .then(items => {
            const menu = document.getElementById('frequentItemsMenu');
            menu.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<a class="dropdown-item frequent-item" href="#" data-id="${item.id}">${item.name}</a>`;
                menu.appendChild(li);
            });
            
            // Add click handlers
            document.querySelectorAll('.frequent-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    addFrequentItem(this.dataset.id);
                });
            });
        });
});

function addFrequentItem(itemId) {
    fetch(`/add_frequent/${itemId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Refresh the list or add the item dynamically
                window.location.reload(); // Simple solution for now
                showToast('Item added to list');
            }
        });
}

document.querySelector('input[name="name"]').addEventListener('input', function(e) {
    // Fetch matching frequent items and show suggestions
});

// Toggle bought status handler
document.querySelectorAll('a[href^="/toggle/"]').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const itemElement = this.closest('.list-group-item');
        const itemId = itemElement.dataset.id;
        const wasBought = itemElement.classList.contains('completed');
        
        fetch(this.getAttribute('href'), {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Update UI
                itemElement.classList.toggle('completed');
                this.classList.toggle('btn-outline-primary');
                this.classList.toggle('btn-outline-success');
                this.textContent = wasBought ? '🛒 Need' : '✅ Purchased';
                
                // Move the item in the DOM
                const list = document.getElementById('sortable-list');
                if (wasBought) {
                    // Moving to unbought section (find first bought item and insert before it)
                    const firstBought = document.querySelector('.list-group-item.completed');
                    if (firstBought) {
                        list.insertBefore(itemElement, firstBought);
                    }
                } else {
                    // Moving to bought section (to the end)
                    list.appendChild(itemElement);
                }
                
                showToast(wasBought ? 'Item marked as needed' : 'Item marked as purchased');
            }
        })
        .catch(error => {
            showToast('Failed to update item status', 'danger');
        });
    });
});
