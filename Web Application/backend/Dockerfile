FROM node:18

RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-dev build-essential && \
    pip3 install --upgrade pip --break-system-packages && \
    pip3 install sentence-transformers keybert scikit-learn --break-system-packages

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8089

CMD ["node", "server.js"]
