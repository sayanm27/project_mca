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


# This is just for testing
@app.route("/name", methods = ["POST"])
@jwt_required()
def name():
    current_user = get_jwt_identity()
    data = request.get_json()
    name = data.get("name")

    return jsonify({
        "message": f"Hello, {name}!"
    })


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
