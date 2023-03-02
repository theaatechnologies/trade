FROM node:alpine

# Create Directory for the Container
WORKDIR /usr/src/app
# Only copy the package.json file to work directory
COPY package.json .
# Install all Packages
RUN npm install -g npm@8.8.0
# Copy all other source code to work directory
ADD . /usr/src/app
# Start
CMD [ "npm", "start" ]
EXPOSE 3000