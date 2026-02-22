FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set strict-ssl false && npm install
COPY . .  
EXPOSE 3002
CMD ["npm", "start"]