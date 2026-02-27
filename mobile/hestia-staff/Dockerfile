FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies + web support
RUN yarn install && \
    yarn add react-dom react-native-web @expo/metro-runtime

# Copy source code
COPY . .

# Create placeholder assets if missing
RUN mkdir -p assets && \
    if [ ! -f assets/icon.png ]; then \
      echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==" | base64 -d > assets/icon.png; \
    fi && \
    cp -n assets/icon.png assets/favicon.png 2>/dev/null || true && \
    cp -n assets/icon.png assets/splash.png 2>/dev/null || true && \
    cp -n assets/icon.png assets/adaptive-icon.png 2>/dev/null || true && \
    cp -n assets/icon.png assets/notification-icon.png 2>/dev/null || true

# Export for web
RUN npx expo export --platform web

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html/hestia-staff

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
