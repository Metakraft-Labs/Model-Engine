FROM node:16-alpine AS builder

WORKDIR /app

COPY package.json .

COPY .npmrc .

RUN npm install

COPY . .

ARG NODE_ENV

ENV NODE_ENV $NODE_ENV

ARG REACT_APP_NAME

ENV REACT_APP_NAME $REACT_APP_NAME

ARG REACT_APP_API_URL

ENV REACT_APP_API_URL $REACT_APP_API_URL

RUN npm run build

FROM nginx:1.21.0-alpine as production

ENV NODE_ENV production

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]