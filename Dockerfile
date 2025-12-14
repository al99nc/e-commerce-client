# Stage 1: Build the React application
# Use a recent Node.js LTS image for the build environment
FROM node:22-alpine as builder

# Set the working directory inside the container
WORKDIR /src

# Copy package.json and package-lock.json (or pnpm-lock.yaml/yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the app for production
RUN npm run build

# Stage 2: Serve the static files with Nginx
# Use a lightweight Nginx image
FROM nginx:alpine

# Copy the built static files from the builder stage to the Nginx web directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for the web server
EXPOSE 80

# Command to start the Nginx server in the foreground
CMD ["nginx", "-g", "daemon off;"]
