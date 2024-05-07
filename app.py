from flask import Flask, render_template, request, redirect, url_for, jsonify
from config import MONGO_URI
from flask_pymongo import PyMongo
from pymongo import MongoClient
from getRiskFree import *


#create an instance of the Flask class
app = Flask(__name__, template_folder="templates")
app.config['MONGO_URI'] = MONGO_URI




@app.route('/')
def index():
    return render_template('index.html')


@app.route('/riskFreeRate', methods=['POST'])
def riskFreeRate():
    riskFreeRate = getRiskFreeRate()
    
    return jsonify({'result': riskFreeRate})


@app.route('/writeUserData', methods=['POST'])
def writeUserData():
    try:
        data = request.get_json()
        userName = data.get('userName')
        userTicker = data.get('userTicker')
        # write on the database
        # Connect to MongoDB using the URI
        client = MongoClient('mongodb://localhost:27017')
        # Select the database
        db = client['mydatabase']
        # Select the collection
        collection = db['users']
        # Insert into the collection
        # Check if the username already exists in the database
        existing_user = collection.find_one({'user': userName})

        if existing_user:
            # If the username exists, update the document by adding the ticker to the list of tickers
            collection.update_one({'user': userName}, {'$addToSet': {'tickers': userTicker}})
        else:
            # If the username doesn't exist, insert a new document with the username and ticker
            collection.insert_one({'user': userName, 'tickers': [userTicker]})
        
        return jsonify(success=True)  # Return a success response

    except Exception as e:
        return jsonify(error=str(e))
    

@app.route('/deleteUser', methods=['POST'])
def delete_user():
    try:
        data = request.get_json()
        username = data.get('username')
        client = MongoClient('mongodb://localhost:27017')
        # Select the database
        db = client['mydatabase']
        # Select the collection
        collection = db['users']
        # Delete user data from the database
        result = collection.delete_one({'user': username})

        if result.deleted_count == 1:
            return jsonify(success=True, message="User data deleted successfully")
        else:
            return jsonify(success=False, message="User not found or already deleted")

    except Exception as e:
        return jsonify(success=False, error=str(e))  # Return error response


if __name__ == "__main__":
    app.run(debug=True)