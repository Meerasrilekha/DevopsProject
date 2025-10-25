# Dockerfile (recommended)
FROM node:20

# set working dir inside container
WORKDIR /usr/src/app

# copy package files first for caching
COPY package*.json ./

# install dependencies inside the container (native modules built for Linux)
RUN npm ci --only=production
# If you need dev deps in the image (tests/build), use `npm ci` instead.

# copy app source code
COPY . .

# expose the port your app uses
EXPOSE 3000

# start the app
CMD ["node", "server.js"]
