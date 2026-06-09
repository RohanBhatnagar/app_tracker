from flask_pymongo import PyMongo
from pymongo import MongoClient
from flask import current_app
import os 
from dotenv import load_dotenv

load_dotenv()

mongo = PyMongo()

def get_mongo_client():
    if not hasattr(current_app, 'mongo_client'):
        current_app.mongo_client = MongoClient(os.getenv('MONGO_URI'))
    return current_app.mongo_client