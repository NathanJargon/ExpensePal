from flask import Flask, render_template, request, redirect, url_for, send_from_directory, make_response, jsonify
import sqlite3, csv, time
from io import StringIO
from waitress import serve
import firebase_admin
from firebase_admin import credentials, auth, db, firestore

app = Flask(__name__, static_url_path='/static')

cred = credentials.Certificate('firebase-admin.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

def get_firebase_user_id(firebase_id_token):
    try:
        decoded_token = auth.verify_id_token(firebase_id_token)
        return decoded_token.get('uid')
    except Exception as e:
        print(f"Firebase Authentication error: {str(e)}")
        return None

def verify_id_token(id_token):
    try:
        decoded_token = auth.verify_id_token(id_token)
        # Check if the token is not expired
        if decoded_token['exp'] >= time.time():
            return decoded_token
        else:
            return None
    except auth.ExpiredIdTokenError:
        # Handle token expiration error
        print("Token has expired.")
        return "Expired"
    except Exception as e:
        # Handle other errors
        print("Error verifying token:", str(e))
        return "Error"
    

@app.route('/get_expenses', methods=['GET'])
def get_expenses():
    # Initialize the Firestore client
    db = firestore.client()

    # Replace 'expenses' with the name of your Firestore collection
    expenses_ref = db.collection('expenses')

    # Fetch all expenses from the Firestore collection
    expenses = expenses_ref.stream()

    # Convert expenses to a list of dictionaries
    expenses_data = []

    for expense in expenses:
        expense_data = expense.to_dict()
        expenses_data.append(expense_data)

    return jsonify({'expenses': expenses_data})

@app.route('/add_expense', methods=['POST'])
def add_expense():
    data = request.get_json()
    firebase_id_token = request.headers.get('Authorization').split('Bearer ')[-1]
    
    user_id = verify_id_token(firebase_id_token)  # Verify the ID token
    
    if user_id:
        if isinstance(user_id, dict) and 'user_id' in user_id:
            data['user_id'] = user_id['user_id']
            
            # Add the expense data to Firestore
            expenses_ref = db.collection('expenses')
            expenses_ref.add(data)

            response_data = {
                'message': 'Expense added successfully',
                'data': data
            }

            return jsonify(response_data)
        else:
            return jsonify({'message': 'Invalid user ID in the token'})
    else:
        return jsonify({'message': 'Unauthorized access'})




@app.route('/view_expenses')
def view_expenses():
    # Get the Firebase user ID for the currently logged-in user
    firebase_id_token = request.cookies.get('your_cookie_name')
    user_id = get_firebase_user_id(firebase_id_token)
    print(firebase_id_token)
    print(user_id)

    if user_id:
        # Fetch and display expenses for the user from Firestore
        expenses_ref = db.collection('expenses').where('user_id', '==', user_id)
        expenses = expenses_ref.stream()
        expenses_data = [expense.to_dict() for expense in expenses]

        return render_template('expenses.html', expenses=expenses_data)
    else:
        # Handle unauthorized access by returning a plain text response or redirecting to the login page.
        return "Unauthorized access"


@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)
    
"""def create_database():
    conn = sqlite3.connect('expenses.db')
    cursor = conn.cursor()  
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            date DATE NOT NULL,
            category TEXT,
            user_id TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

create_database()

def fetch_expenses():
    conn = sqlite3.connect('expenses.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM expenses')
    rows = cursor.fetchall()
    conn.close()
    return rows"""

@app.route('/delete_expense/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    try:
        # Initialize the Firestore client
        db = firestore.client()

        # Replace 'expenses' with the name of your Firestore collection
        expenses_ref = db.collection('expenses')

        # Delete the expense with the given expense_id
        expenses_ref.document(expense_id).delete()

        return jsonify({'message': 'Expense deleted successfully'})
    except Exception as e:
        return jsonify({'message': f'Error deleting expense: {str(e)}'}, 500)



@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        description = request.form['description']
        amount = float(request.form['amount'])
        date = request.form['date']
        category = request.form['category']

        conn = sqlite3.connect('expenses.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO expenses (description, amount, date, category)
            VALUES (?, ?, ?, ?)
        ''', (description, amount, date, category))
        conn.commit()
        conn.close()

        return redirect(url_for('index'))

    return render_template('index.html')

@app.route('/upload', methods=['GET', 'POST'])
def upload_csv():
    if request.method == 'POST':
        csv_file = request.files['csv_file']

        if csv_file:
            # Read CSV file and parse it
            csv_data = csv_file.read().decode('utf-8')
            csv_reader = csv.reader(StringIO(csv_data))

            # Skip the header row if it exists
            next(csv_reader, None)

            conn = sqlite3.connect('expenses.db')
            cursor = conn.cursor()

            for row in csv_reader:
                if len(row) == 4:
                    description, amount, date, category = row
                    cursor.execute('''
                        INSERT INTO expenses (description, amount, date, category)
                        VALUES (?, ?, ?, ?)
                    ''', (description, float(amount), date, category))

            conn.commit()
            conn.close()

            return redirect(url_for('index'))

    return render_template('upload.html')

if __name__ == '__main__':
    app.run(debug=True)