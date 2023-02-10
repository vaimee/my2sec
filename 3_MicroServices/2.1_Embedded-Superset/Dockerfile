# CUSTOM SUPERSET CONTAINER TO EMBED DASHBOARDS
FROM apache/superset

# Switching to root to install the required packages
#USER root

# Load custom configuration
COPY ./superset_config.py /app/pythonpath/superset_config.py

# 
#RUN superset fab create-admin --username admin --firstname Superset --lastname Admin --email admin@superset.com --password admin
#RUN superset db upgrade
#RUN superset init

# Switching back to using the `superset` user
#USER superset