FROM node:18

# Installa Python e le librerie necessarie
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-dev build-essential && \
    pip3 install --upgrade pip && \
    pip3 install numpy scikit-learn

# Imposta la working directory per Node.js
WORKDIR /app

# Copia e installa dipendenze Node.js (se richieste altrove nel progetto)
COPY package*.json ./
RUN npm install

# Copia tutto il progetto
COPY . .

# Espone la porta per Node.js (se server.js è necessario)
EXPOSE 8089

# Avvia il server Node.js (se richiesto)
CMD ["node", "server.js"]
