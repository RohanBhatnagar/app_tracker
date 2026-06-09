from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_restx import Api
from app.config import Config
from app.extensions import get_mongo_client


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    jwt = JWTManager(app)
    CORS(
        app,
        supports_credentials=False,
        resources={r"/*": {"origins": app.config["CORS_ALLOWED_ORIGINS"]}},
    )

    api = Api(app, docs='/docs')

    with app.app_context():
        client = get_mongo_client()
        try:
            client.admin.command('ping')
            print("Successfully connected to MongoDB!")
        except Exception as e:
            print(e)

    app.mongo_client = client

    from app.api.auth_routes import auth_ns
    from app.api.user_routes import user_ns
    from app.api.inference_routes import inference_ns
    from app.api.openai_routes import openai_ns
    from app.api.payment_routes import payment_ns

    api.add_namespace(auth_ns, path='/auth')
    api.add_namespace(user_ns, path='/protected/user')
    api.add_namespace(inference_ns, path='/protected/inference')
    api.add_namespace(openai_ns, path='/protected/extract')
    api.add_namespace(payment_ns, path='/protected/payment')

    return app
