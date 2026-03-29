from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

# Create an instance of the Flask class
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "45969730"  # Change this!
jwt = JWTManager(app)

# Use the route() decorator to bind a function to a URL
@app.route("/name", methods = ["POST"])
@jwt_required()
def name():
    current_user = get_jwt_identity()
    data = request.get_json()
    name = data.get("name")

    return jsonify({
        "message": f"Hello, {name}!"
    })


@app.route("/auth", methods = ["POST"])
def auth():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    if username != "test" or password != "test":
        return jsonify({"msg": "Bad credentials"}), 401
    
    access_token = create_access_token(identity=username)
    return jsonify(access_token=access_token)

# Run the application
if __name__ == "__main__":
    app.run(debug=True)
