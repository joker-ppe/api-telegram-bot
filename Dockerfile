# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory within the container
WORKDIR /app

# Copy package.json and yarn.lock to the container
COPY package*.json yarn.lock ./

# Install application dependencies using Yarn
RUN yarn install

# Copy the rest of the application code to the container
COPY . .

# Generate the Prisma client during the build process
# RUN npx prisma migrate dev
# RUN prisma migrate deploy

# Expose the port that your Nest.js application will run on
EXPOSE 3004

# Define the command to start your Nest.js application
CMD ["yarn", "start"]
