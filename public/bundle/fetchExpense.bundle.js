document.addEventListener("DOMContentLoaded",(function e(){var t=document.getElementById("expense-table-body");t.innerHTML='<tr><td colspan="5">Loading...</td></tr>',firebase.auth().onAuthStateChanged((function(n){n?n.getIdToken().then((function(o){fetch("/get_expenses?email=".concat(n.email,"&timestamp=").concat(Date.now()),{headers:{Authorization:"Bearer "+o}}).then((function(e){return e.json()})).then((function(n){console.log("Fetched data:",n),t.innerHTML="",n.user_expenses?(n.user_expenses.forEach((function(n){var o=document.createElement("tr");o.innerHTML='\n                                <td class="expense-date">'.concat(n.date,"</td>\n                                <td>").concat(n.description,"</td>\n                                <td>").concat(n.category,"</td>\n                                <td>").concat(parseFloat(n.amount).toFixed(2),'</td> \x3c!-- Format with 2 decimal places --\x3e\n                                <td style="padding-right: 15px; text-align: right;">\n                                    <button class="btn btn-primary delete-button-small" data-id="').concat(n.data_id,'">Delete</button>\n                                </td>\n                            '),o.querySelector(".delete-button-small").addEventListener("click",(function(){return t=n.data_id,void firebase.auth().onAuthStateChanged((function(n){n&&n.getIdToken().then((function(n){var o=n;document.cookie="your_firebase_cookie_name="+o,fetch("/delete_expense/".concat(t),{method:"DELETE",headers:{Authorization:"Bearer "+o}}).then((function(e){if(e.ok)return e.json();throw new Error("Failed to delete expense. Status: ".concat(e.status))})).then((function(t){e()})).catch((function(e){"Failed to delete expense. Status: 404"===e.message&&alert("Expense not found.")}))})).catch((function(e){console.error("Error getting ID token:",e)}))}));var t})),t.appendChild(o)})),updateTotal(n.user_expenses)):console.error("Error: Expenses data is undefined")})).catch((function(e){console.error("Error fetching expenses:",e),t.innerHTML='<tr><td colspan="5">Error fetching expenses.</td></tr>'}))})).catch((function(e){console.error("Error getting ID token:",e),t.innerHTML='<tr><td colspan="5">Error getting ID token.</td></tr>'})):(console.error("User not signed in. Cannot fetch expenses."),t.innerHTML='<tr><td colspan="5">User not signed in.</td></tr>')}))}));