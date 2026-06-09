#!/bin/bash

LOG_FILE="/home/ec2-user/rohan/logs/deploy_$(date +'%Y%m%d_%H%M%S').log"
ENVIRONMENT="prod"

pkill -f "python3 manage.py" || echo "No existing backend process found."

echo "Installing libraries from require.txt." 

pip install -r ./backend-flask/requirements.txt

echo "Pulling latest changes from GitHub..."

cd ./

git pull origin production

echo "Changes pulled successfully!" 
echo "Navigating to backend directory." 

# run backend in background so script can terminate and clean
cd ./backend-flask

if [ "$ENVIRONMENT" = "prod" ]; then
    echo "Running production setup..."
    pkill -f "gunicorn" || echo "No existing Gunicorn process found."
    
    cd ./backend-flask
    gunicorn -c gunicorn_config.py manage:app > /dev/null 2>&1 &
    
elif [ "$ENVIRONMENT" = "dev" ]; then
    echo "Running development setup..."
    pkill -f "python3 manage.py" || echo "No existing development server process found."
    
    cd ./backend-flask
    nohup python3 manage.py 2 > /dev/null 2>&1 &
    
else
    echo "Unknown environment: $ENVIRONMENT"
    exit 1
fi

echo "Deployment completed at $(date)"
echo "Deployment log saved to $LOG_FILE"