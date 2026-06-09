from flask import Blueprint, jsonify, request, current_app, make_response
from bson.objectid import ObjectId
from app.extensions import mongo, get_mongo_client
from app.models.User import User
from flask_jwt_extended import jwt_required
from flask_restx import Namespace, Resource

user_ns = Namespace('user', description="User related operations")


@user_ns.route('/getall')
class GetAll(Resource):
    @jwt_required()
    def get(self):
        users = User.find_all()
        return make_response(jsonify(users), 200)


@user_ns.route('/add')
class AddUser(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        email = data.get('email')
        spreadsheetUrl = data.get('spreadsheetUrl', "")
        spreadsheetId = data.get('spreadsheetId', "")
        lastChecked = data.get('lastChecked', None)
        user = User(
            email=email,
            spreadsheetUrl=spreadsheetUrl,
            spreadsheetId=spreadsheetId,
            lastChecked=lastChecked
        )
        user.save()
        return make_response(jsonify({"message": "User added successfully!"}), 201)


@user_ns.route('/<email>')
class SpecificUser(Resource):
    @jwt_required()
    def get(self, email):
        user = User.find_by_email(email)
        if user:
            return make_response(jsonify(user), 200)
        return make_response(jsonify({"error": "User not found"}), 404)

    @jwt_required()
    def put(self, email):
        data = request.get_json()
        User.update(email, data)
        return make_response(jsonify({"message": "User updated successfully!"}), 200)


@user_ns.route('/<email>/lastChecked')
class LastChecked(Resource):
    @jwt_required()
    def get(self, email):
        user = User.find_by_email(email)
        if user:
            return make_response(jsonify({"lastChecked": user.get('lastChecked')}), 200)
        return make_response(jsonify({"error": "User not found"}), 404)


@user_ns.route('/sheetupdate')
class UpdateSheet(Resource):
    @jwt_required()
    def put(self):
        data = request.get_json()['updateData']
        for message in data:
            User.one_update(message['email'], message['recent'])
            return make_response(jsonify({"message": "User updated successfully!"}), 200)


@user_ns.route('/<email>/metrics')
class Metrics(Resource):
    @jwt_required()
    def get(self, email):
        user = User.find_by_email(email)
        num_apps = 0
        num_pending = 0
        num_move_on = 0
        num_rejections = 0
        if user:
            recents = list(user.get('recents'))
            for idx, item in enumerate(recents):
                if (idx > 0):
                    status = item[2]
                    num_apps += 1
                    if status == 'pending':
                        num_pending += 1
                    elif status == 'rejection':
                        num_rejections += 1
                    elif status == 'moving on':
                        num_move_on += 1
            return make_response(jsonify({"total": num_apps, "pending": num_pending, "rejections": num_rejections, "movingOn": num_move_on}), 200)
        return make_response(jsonify({"error": "Couldn't find user."}), 401)


@user_ns.route('/<email>/recents')
class Recents(Resource):
    @jwt_required()
    def get(self, email):
        user = User.find_by_email(email)
        display = []
        if user:
            recents = list(reversed(list(user.get('recents'))))
            for idx, item in enumerate(recents):
                if idx < len(recents) and len(item) > 1:
                    display.append(item)
                else:
                    continue
            return make_response(jsonify(display), 200)
        return make_response(jsonify({"error": "User not found"}), 404)


@user_ns.route('/<email>/recents/delete')
class DeleteJob(Resource):
    @jwt_required()
    def delete(self, email):
        data = request.get_json()
        company = data.get('company')
        role = data.get('role')

        success = User.delete_job(email, company, role)
        if success:
            return make_response(jsonify({"message": "Job deleted successfully"}), 200)
        return make_response(jsonify({"error": "Job not found or couldn't be deleted"}), 404)


@user_ns.route('/<email>/recents/status')
class UpdateJobStatus(Resource):
    @jwt_required()
    def put(self, email):
        data = request.get_json()
        company = data.get('company')
        role = data.get('role')
        status = data.get('status')

        success = User.update_job_status(email, company, role, status)
        if success:
            return make_response(jsonify({"message": "Job status updated successfully"}), 200)
        return make_response(jsonify({"error": "Job not found or couldn't be updated"}), 404)
