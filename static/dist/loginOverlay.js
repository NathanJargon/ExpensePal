document.addEventListener('DOMContentLoaded', function () {
  const expenseForm = document.getElementById('expense-form');
  const loginButton = document.getElementById('login-button');
  const loginForm = document.getElementById('loginOverlay'); 
  const login_Email = document.getElementById('email');
  const login_Password = document.getElementById('password');
  const login_TextContent = document.getElementById('loginLogoutLink');
  const userNameElement = document.getElementById('userName');

  if (expenseForm) {
    expenseForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const description = document.querySelector('input[name="description"]').value;
      const amount = document.querySelector('input[name="amount"]').value;
      const date = document.querySelector('input[name="date"]').value;
      const category = document.querySelector('input[name="category"]').value;

      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          user.getIdToken()
            .then(function (idToken) {
              // Log the ID token to the console
              const id_Token = idToken;
              document.cookie = 'your_firebase_cookie_name=' + id_Token;

              const expenseData = {
                description,
                amount,
                date,
                category,
                idToken: id_Token,
                email: user.email,
              };

              fetch('/add_expense', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + id_Token,
                },
                body: JSON.stringify(expenseData),
              })
              .then(response => {
                if (response.status === 200) {
                  fetchAndUpdateExpenses();
                } else {
                  console.error('Failed to add expense:', response.status);
                }
              })
              .catch(error => {
                console.error('Error adding expense:', error);
              });
            })
            .catch(function (error) {
              console.error('Error getting ID token:', error);
            });
        }
      });
    });
  }

  if (loginButton) {
    loginButton.addEventListener('click', () => {
      const loginEmail = login_Email.value;
      const loginPassword = login_Password.value;

      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          user.getIdToken()
            .then(function (idToken) {
              // Log the ID token to the console
              const id_Token = idToken;
              document.cookie = 'your_firebase_cookie_name=' + id_Token;

              const expenseData = {
                uid: user.uid,
                idToken: id_Token,
              };
              
              /*
              fetch('/add_expense', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + id_Token,
                },
                body: JSON.stringify(expenseData),
              })
              .then(response => {
                if (response.status === 200) {
                  return response.json();
                } else {
                  throw new Error('Request failed with status: ' + response.status);
                }
              })
              .then(data => {
                console.log('Response from server:', data);
              })
              .catch(error => {
                console.error('Error:', error);
              });
            })
            .catch(function (error) {
              console.error('Error getting ID token:', error);
          */
         
            });
            

          if (user.email) {
            const userEmail = user.email;
            let userName = userEmail.split('@')[0].slice(0, 5).toUpperCase();
            login_TextContent.textContent = 'Logout';
            userNameElement.textContent = userName;
            localStorage.setItem('userName', userName);
          }
          loginForm.style.display = 'none';
        }
      });

      firebase.auth()
        .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(function() {
          return firebase.auth().signInWithEmailAndPassword(loginEmail, loginPassword);
        })
        .then((userCredential) => {
          const user = userCredential.user;
          //console.log('Login successful:', userCredential.email);
          loginForm.style.display = 'none';
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          //console.error('Login error:', errorCode, errorMessage);

          if (errorCode === 'auth/wrong-password') {
            alert('Wrong password.');
            login_Password.style.animation = 'turnRed 1s, shake 0.5s';
          } else if (errorCode === 'auth/internal-error') {
            alert('Internal Error.');
            login_Password.style.animation = 'turnRed 1s, shake 0.5s';
          } else if (errorCode === 'auth/user-not-found') {
            alert('User not found.');
            login_Email.style.animation = 'turnRed 1s, shake 0.5s';
          } else if (errorCode === 'auth/invalid-email') {
            alert('Invalid email.');
            login_Email.style.animation = 'turnRed 1s, shake 0.5s';
          }
        });
    });
  }

});
