function fetchAndUpdateExpenses() {
    const tableBody = document.getElementById('expense-table-body');
    tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>'; // Display loading indicator

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            user.getIdToken().then(idToken => {
                fetch(`/get_expenses?email=${user.email}&timestamp=${Date.now()}`,  {
                    headers: {
                        'Authorization': 'Bearer ' + idToken,
                    },
                })
                .then(response => response.json())
                .then(data => {
                    //console.log("Fetched data:", data);
                    tableBody.innerHTML = ''; // Clear the loading indicator
                
                    if (data.user_expenses) { // Check if data.user_expenses is defined
                        data.user_expenses.forEach(expense => {
                            const newRow = document.createElement('tr');
                            newRow.innerHTML = `
                                <td class="expense-date">${expense.date}</td>
                                <td>${expense.description}</td>
                                <td>${expense.category}</td>
                                <td>${parseFloat(expense.amount).toFixed(2)}</td> <!-- Format with 2 decimal places -->
                                <td style="padding-right: 15px; text-align: right;">
                                    <button class="btn btn-primary delete-button-small" data-id="${expense.data_id}">Delete</button>
                                </td>
                            `;
                
                            newRow.querySelector('.delete-button-small').addEventListener('click', () => deleteExpense(expense.data_id));
                
                            tableBody.appendChild(newRow);
                        });
                
                        updateTotal(data.user_expenses);
                    } else {
                        console.error('Error: Expenses data is undefined');
                    }
                })
                
        .catch(error => {
            console.error('Error fetching expenses:', error);
            tableBody.innerHTML = '<tr><td colspan="5">Error fetching expenses.</td></tr>'; // Display error message
        });
    })
    .catch(error => {
        console.error('Error getting ID token:', error);
        tableBody.innerHTML = '<tr><td colspan="5">Error getting ID token.</td></tr>'; // Display error message
    });
    } else {
        console.error('User not signed in. Cannot fetch expenses.');
        tableBody.innerHTML = '<tr><td colspan="5">User not signed in.</td></tr>'; // Display error message
    }
 });
}

function deleteExpense(expenseUid) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            user.getIdToken()
                .then(function (idToken) {
                    const id_Token = idToken;
                    document.cookie = 'your_firebase_cookie_name=' + id_Token;
                    //console.log(user.uid);
                    //console.log(expenseUid)
                    fetch(`/delete_expense/${user.email}/${expenseUid}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': 'Bearer ' + id_Token,
                        },
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json();  // Assuming the server sends a JSON response on success
                        } else {
                            throw new Error(`Failed to delete expense. Status: ${response.status}`);
                        }
                    })
                    .then(data => {
                        //console.log('Expense deleted successfully:', data);
                        fetchAndUpdateExpenses();  // Update the UI after successful deletion
                    })
                    .catch(error => {
                        //console.error('Error deleting expense:', error);
                        
                        // Check if the error is due to the expense not found
                        if (error.message === 'Failed to delete expense. Status: 404') {
                            alert('Expense not found.');  // Display an alert or update the UI accordingly
                        }
                    });
                })
                .catch(function (error) {
                    console.error('Error getting ID token:', error);
                });
        }
    });
}

// Call the function to fetch and update expenses when the page loads
document.addEventListener('DOMContentLoaded', fetchAndUpdateExpenses);
