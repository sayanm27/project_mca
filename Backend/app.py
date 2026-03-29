from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import sqlite3
import utilities


app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "45969730"  
jwt = JWTManager(app)

#Constant variables used below
DB_NAME = "database.db"
ADMIN_USER = "A"
NORMAL_USER = "U"

"""GET CALLS"""

#Used to get names of all tests
@app.route("/get_tests", methods = ["GET"])
def get_tests():
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        fetched_tests = cursor.execute("SELECT testname FROM Test")

        tests = fetched_tests.fetchall()
        return jsonify({
            "tests" : tests
        }), 200

    return jsonify({
        "tests": ""
    }), 400

#Used to get all questions in a test
@app.route("/get_questions", methods = ["GET"])
def get_questions():
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        testid = request.args.get('testid')
        try: 
            questionid_query = "SELECT questionid FROM Test WHERE testid = ?"
            questionid = cursor.execute(questionid_query, (testid, )).fetchone()[0]
        except: 
            return jsonify({
                "message": "invalid test id!"
            }), 400
        
        questions_query = "SELECT * FROM Questions WHERE questionid = ?"
        fetched_questions = cursor.execute(questions_query, (questionid, ))

        questions = []
        for question in fetched_questions.fetchall():
            questions.append({
                "number" : question[1],
                "question": question[2],
                "option1": question[3],
                "option2": question[4],
                "option3": question[5],
                "option4": question[6]
            })

        # questions = fetched_questions.fetchall()
        return jsonify({
            "questions" : questions
        }), 200

    return jsonify({
        "questions": ""
    }), 400


"""POST CALLS"""
# Used to create testIDs mapped to a question ID
@app.route("/create_test", methods = ["POST"])
@jwt_required()
def create_tests():
    current_user = get_jwt_identity()

    data = request.get_json()

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()

        existence_check_query = "SELECT * FROM Test WHERE testid = ?"
        existence_check = cursor.execute( existence_check_query, ( data.get("testid"),  ) )
        if existence_check.fetchone() != None:
            return jsonify({
                "message": "Test ID already exists!"
            }), 400

        #Get the latest questionid and then increment it, if not found, start with 1
        try:
            last_question_id = cursor.execute("SELECT questionid FROM Questions ORDER BY questionid DESC LIMIT 1").fetchone()[0]
        except:
            last_question_id = 0
        current_question_id = last_question_id + 1

        insert_query = "INSERT INTO Test ( testid, testname, instructions, questionid ) VALUES ( ?, ?, ?, ? )"  
        cursor.execute(insert_query, (data.get("testid"), data.get("testname"), data.get("instructions"), str( current_question_id ) ))
        conn.commit()

        confirmation_query = "SELECT * FROM Test WHERE testid = ?"
        confirmation = cursor.execute(confirmation_query, (data.get("testid"), ))

    if confirmation.fetchone() != None:
        return jsonify({
            "message": "Test successfully created!"
        }), 200
    else: 
        return jsonify({
            "message": "Error in creating test!"
        }), 500

#Used to create a question inside a question id
@app.route("/add_question", methods = ["POST"])
@jwt_required()
def add_questions():
    current_user = get_jwt_identity()

    data = request.get_json()

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        try: 
            questionid_query = "SELECT questionid FROM Test WHERE testid = ? "
            questionid = cursor.execute(questionid_query, ( data.get("testid"), ) ).fetchone()[0]
        except: 
            return jsonify({
                "message" : "Invalid test id!"
            }), 400
        print(questionid)
        quest_number_query = "SELECT number FROM Questions WHERE questionid = ? ORDER BY number DESC LIMIT 1"
        try: 
            last_question_number = cursor.execute(quest_number_query, (questionid,)).fetchone()[0]
            
        except: 
            last_question_number = 0
        current_question_number = last_question_number + 1
        print(current_question_number)
        quest_insert_query = "INSERT INTO Questions ( questionid, number, question, option1, option2, option3, option4 ) values ( ?, ?, ?, ?, ?, ?, ? )"
        cursor.execute(quest_insert_query, ( questionid, current_question_number, data.get("question"), data.get("option1"), data.get("option2"), data.get("option3"), data.get("option4") ))
        conn.commit()

        confirmation_query = "SELECT questionid FROM Questions WHERE questionid = ? AND number = ?"
        confirmation = cursor.execute(confirmation_query, ( questionid, current_question_number ))

    if confirmation.fetchone() != None: 
        return jsonify({
            "message" : "Question inserted successfully!"
        }), 200
    else: 
        return jsonify({
            "message" : "Error in question insert"
        }), 500

    return None

#Used to create a user
@app.route("/create_user", methods = ["POST"])
@jwt_required()
def create_user():
    #jwt authentication
    current_user = get_jwt_identity()
    print(current_user)

    #Getting the data from payload
    data = request.get_json()
    key = utilities.load_key()
    encrypted_pwd = utilities.encrypt_message( data.get("pwd"), key )

    #Insert the user with the latest user id according to the test id, name and password given
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()

        #Only the admin users with user type "A" should be able to create users
        auth_check = cursor.execute("SELECT role FROM Users WHERE userid = " + str(current_user))
        if auth_check.fetchone()[0] != ADMIN_USER:
            return jsonify({
                "message": "User not authorized to create users!"
            }), 401

        #Get the last used user id and increment it by 1
        try:
            last_user_id = cursor.execute("SELECT userid FROM Users ORDER BY userid DESC LIMIT 1").fetchone()[0]
        except: 
            last_user_id = 1000
        current_user_id = last_user_id + 1

        #Form the select query with placeholders to prevent SQL injection
        insert_query = "INSERT INTO Users ( userid, pwd, name, role, testid ) VALUES ( ?, ?, ?, ?, ?)"
        cursor.execute(insert_query, ( str(current_user_id), encrypted_pwd, data.get("name"), NORMAL_USER, data.get("testid") ) )
        conn.commit()

        #Verifying creation of user
        confirmation = cursor.execute("SELECT userid FROM Users WHERE userid = " + str(current_user_id))

    #Once succesfully created, return a success message
    if confirmation.fetchone() != None:
        return jsonify({
            "message": "User Created successfully"
        })
    else: 
        return jsonify({
            "message": "User creation failed"
        })

#Used for login authentication
@app.route("/auth", methods = ["POST"])
def auth():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    key = utilities.load_key()

    with sqlite3.connect(DB_NAME) as conn:

        verify_query = "SELECT pwd FROM Users WHERE userid = ? "
        cursor = conn.execute(verify_query, ( username,  ) )

    #Decrypt the password and then verify
    try: 
        password_fetched = cursor.fetchone()[0]
    except Exception as e:
        return jsonify({"msg": "Bad credentials"}), 401
    
    
    password_decrypted = utilities.decrypt_message( password_fetched, key )    
    
    if password != password_decrypted:
        return jsonify({"msg": "Bad credentials"}), 401

    
    access_token = create_access_token(identity=str(username))
    return jsonify(access_token=access_token)

# Run the application
if __name__ == "__main__":
    app.run(debug=True)
