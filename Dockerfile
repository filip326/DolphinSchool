FROM node:20-alpine

# set production environment
ENV NODE_ENV=production 

# set working directory
WORKDIR /app

COPY [ "package.json", "package-lock.json", "./" ]

# install depencencied
RUN npm ci

COPY . .

# build app
RUN npm run build

# expose port 3000 to outside world
EXPOSE 3000

# start command as per package.json
CMD ["npm", "run", "start"]