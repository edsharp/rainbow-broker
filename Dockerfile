FROM node

WORKDIR /home/node/app
COPY . .

RUN npm install && \
npm run build && \
openssl genrsa -out localhost.key 2048 && \
openssl req -new -x509 -key localhost.key -out localhost.cert -days 3650 -subj /CN=localhost
