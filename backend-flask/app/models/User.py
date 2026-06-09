from bson.objectid import ObjectId
from flask import current_app
from app.extensions import get_mongo_client
from datetime import datetime


class User:
    def __init__(self, email, lastChecked, spreadsheetId, spreadsheetUrl):
        self.email = email
        self.lastChecked = lastChecked if lastChecked is not None else int(
            datetime.utcnow().timestamp())
        self.spreadsheetUrl = spreadsheetUrl
        self.spreadsheetId = spreadsheetId
        self.date = datetime.utcnow()

    @staticmethod
    def get_collection():
        client = get_mongo_client()
        db = client['test']
        return db.users

    # insert one user
    def save(self):
        collection = self.get_collection()
        if not User.find_by_email(self.email):
            user_data = {
                "email": self.email,
                "date": self.date,
                "spreadsheetUrl": self.spreadsheetUrl,
                "spreadsheetId": self.spreadsheetId,
                "lastChecked": self.lastChecked,
                "recents": [['User Created']]
            }
            collection.insert_one(user_data)

    @staticmethod
    def find_by_id(user_id):
        collection = User.get_collection()
        user = collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
        return user

    @staticmethod
    def find_by_email(email):
        collection = User.get_collection()
        user = collection.find_one({"email": email})
        if user:
            user["_id"] = str(user["_id"])
        return user

    @staticmethod
    def update(email, data):
        collection = User.get_collection()
        collection.update_one({"email": email}, {"$set": data})

    @staticmethod
    def one_update(email, recent):
        user = User.find_by_email(email)
        collection = User.get_collection()
        recents = user.get('recents', [])
        updated_recents = recents + [recent]
        collection.update_one(
            {"email": user['email']},
            {"$set": {"recents": updated_recents}}
        )

    # only for admin purposes
    @staticmethod
    def delete(email):
        collection = User.get_collection()
        collection.delete_one({"email": email})

    @staticmethod
    def find_all():
        collection = User.get_collection()
        users = collection.find()
        result = []
        for user in users:
            user["_id"] = str(user["_id"])
            result.append(user)
        return result

    # this should we way shorter, we need to make the array an array of objs
    @staticmethod
    def delete_job(email, company, role):
        collection = User.get_collection()

        user = User.find_by_email(email)
        if not user:
            return False

        recents = user.get("recents", [])
        new_recents = [job for job in recents if not (
            job[0] == company and job[1] == role)]

        result = collection.update_one(
            {"email": email},
            {"$set": {"recents": new_recents}}
        )
        return result.modified_count > 0

    @staticmethod
    def update_job_status(email, company, role, status):
        collection = User.get_collection()

        user = User.find_by_email(email)
        if not user:
            return False

        recents = user.get("recents", [])
        updated = False

        for job in recents:
            if len(job) > 2 and job[0] == company and job[1] == role:
                job[2] = status
                updated = True

        if not updated:
            return False

        result = collection.update_one(
            {"email": email},
            {"$set": {"recents": recents}}
        )
        return result.modified_count > 0
