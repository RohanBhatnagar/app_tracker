from flask import Blueprint, jsonify, request, render_template, make_response
from app.extensions import mongo
import joblib, os
import numpy as np 
from flask_jwt_extended import jwt_required
from flask_restx import Namespace, Resource

inference_ns = Namespace('inference', description="Inference related operations")

current_dir = os.path.dirname(os.path.abspath(__file__))

vect_path = os.path.join(current_dir, '..', 'classification', 'tfidf_vectorizer_v2.joblib')
log_reg_path = os.path.join(current_dir, '..', 'classification', 'logistic_regression_v2.joblib')

try:
    vectorizer = joblib.load(vect_path)
    clf = joblib.load(log_reg_path)
    print("Successfully loaded models!")
except FileNotFoundError as e:
    print(f"Error loading model: {e}")
    vect, log_reg = None, None

@inference_ns.route('/classify', methods=['POST'])
class Classify(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        res = [] 
        for subject in list(data.get('subjects')):
            feature = vectorizer.transform([subject])
            prediction = clf.predict(feature)[0]
            subject_clas = "Yes" if prediction else "No"
            res.append(subject_clas)
        return make_response(jsonify({"predictions": res}), 200)


