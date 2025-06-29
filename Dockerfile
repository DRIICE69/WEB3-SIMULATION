
FROM node:14

# Dossier de destination
WORKDIR /drx/web3/dockerDir

#Copie
COPY package*.json ./

# installation dependances nodes

RUN npm install

# Copie
COPY . .

# Port du serveur
EXPOSE 3000

#Lancement
CMD ["node", "index.js"]
