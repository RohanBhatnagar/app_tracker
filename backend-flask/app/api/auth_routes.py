from flask import jsonify, request, make_response
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, create_refresh_token
)
from flask_restx import Namespace, Resource
import requests

auth_ns = Namespace('auth', description="Auth related operations")

def verify_google_token(token):
    try:
        # Verify the token with Google
        response = requests.get(
            f'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={token}'
        )
        idinfo = response.json()
        if response.status_code != 200:
            print(f"Token verification error: {idinfo.get('error_description', 'Unknown error')}")
            return None
        if 'email' in idinfo:
            print(f"Token verified for email: {idinfo['email']}")  # Log the verified email
            return idinfo
    except Exception as e:
        print(f"Token verification exception: {e}")  # Log the verification exception
        return None
    return None

@auth_ns.route('/login')
class Login(Resource):
    def post(self):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return make_response(jsonify({"msg": "Missing Authorization Header"}), 400)
        token = auth_header.split()[1]
        idinfo = verify_google_token(token)
        if idinfo:
            access_token = create_access_token(identity=idinfo['email'])
            refresh_token = create_refresh_token(identity=idinfo['email'])
            return make_response(
                jsonify({"access_token": access_token, "refresh_token": refresh_token}),
                200,
            )
        return make_response(jsonify({"msg": "Bad token"}), 401)

@auth_ns.route('/protected')
class Protected(Resource):
    @jwt_required()
    def protected(self):
        current_user = get_jwt_identity()
        return make_response(jsonify(logged_in_as=current_user), 200)

@auth_ns.route('/token/refresh')
class TokenRefresh(Resource):
    @jwt_required(refresh=True)
    @auth_ns.response(200, 'Token successfully refreshed.')
    @auth_ns.response(401, 'Invalid token.')
    def post(self):
        """Refresh the access token"""
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)
        return make_response(jsonify({'refresh': True, 'access_token': access_token}), 200)
