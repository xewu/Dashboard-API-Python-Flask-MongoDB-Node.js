from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'airbnb'
COLLECTION_NAME = 'projects'

FIELDS = {'date_first_booking': True,
          'affiliate_provider': True,
          'first_device_type': True,
          'country_destination': True,
          'count': True,
          '_id': False}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/airbnb/projects")
def airbnb_projects():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    #projects = collection.find({}, FIELDS)
    projects = collection.find(projection=FIELDS)
    #projects = collection.find(projection=FIELDS)
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    return json_projects

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=4000,debug=True)
