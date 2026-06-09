import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

# Define expiration times
ACCESS_EXPIRES = timedelta(hours=1)  # Access token expires in 1 hour
REFRESH_EXPIRES = timedelta(days=30)  # Refresh token expires in 30 days

class Config:
    MONGO_URI = os.getenv('MONGO_URI')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = ACCESS_EXPIRES
    JWT_REFRESH_TOKEN_EXPIRES = REFRESH_EXPIRES
    JWT_TOKEN_LOCATION = ["headers"]
    CORS_ALLOWED_ORIGINS = [
        origin.strip()
        for origin in os.getenv('CORS_ALLOWED_ORIGINS', '*').split(',')
        if origin.strip()
    ]
