FROM node:20

# Install cron
RUN apt-get update && apt-get install -y cron && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Copy the .env and .env.development files
COPY .env .env ./

# Creates a "dist" folder with the production build
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3000

# Add cron job to crontab
RUN echo "*/30 * * * * curl --location --request POST 'https://dev-rppj.ugems.id/api/cp/check-tonages-cp' --header 'Content-Type: application/json' --data '{\"device_id\": \"sKp3RjYB\", \"item_id\": \"0aYdeR07\"}' >> /var/log/cron.log 2>&1" > /etc/cron.d/cronjob \
    && chmod 0644 /etc/cron.d/cronjob \
    && crontab /etc/cron.d/cronjob

# Create a log file for debugging
RUN touch /var/log/cron.log

# Add shell script for 5-second interval job with GET method
RUN echo '#!/bin/bash\nwhile true; do\n  curl --location --request GET "https://dev-rppj.ugems.id/api/cp/check-all-tonages-cp" >> /var/log/cron_5s.log 2>&1\n  sleep 5\ndone' > /usr/src/app/5s_cron.sh \
    && chmod +x /usr/src/app/5s_cron.sh

# Start cron and the application
CMD cron && ./5s_cron.sh & npm run start:prod