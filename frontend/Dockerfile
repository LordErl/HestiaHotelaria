FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile || yarn install

# Copy source code
COPY . .

# Set environment variables for build
ENV REACT_APP_BACKEND_URL=https://itserpapi.duckdns.org/hestia
ENV PUBLIC_URL=/hestia

# Build the app
RUN yarn build

# Production stage
FROM nginx:alpine

# Copy built files into /hestia/ subdir to match PUBLIC_URL
COPY --from=build /app/build /usr/share/nginx/html/hestia

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
