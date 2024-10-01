FROM node:lts as base

WORKDIR /app
COPY package.json .
RUN npm install

FROM base as build
COPY . .
# FIXME: tsc doesn't have --transpile-only flag. (https://github.com/microsoft/TypeScript/issues/29651)
# RUN npm run build

# FROM base as run
# COPY --from=build /app/build ./build

# NOTE: ./src/config/index.ts checks the existence of `.env` file.
RUN touch .env

ARG PORT=7575
ENV PORT $PORT
EXPOSE $PORT

# FIXME: tsc doesn't have --transpile-only flag. (ditto)
# CMD node build/app
CMD npm start -- --exitcrash
