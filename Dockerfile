FROM node:20-alpine
WORKDIR /app

# Copy workspace manifests so npm install can resolve all workspaces
COPY package*.json ./
COPY apps/nurse/package.json       ./apps/nurse/
COPY apps/pharmacist/package.json  ./apps/pharmacist/
COPY apps/admin/package.json       ./apps/admin/
COPY packages/ui/package.json      ./packages/ui/
COPY packages/client/package.json  ./packages/client/
COPY packages/config/package.json  ./packages/config/

RUN npm install

# Generate the Prisma client so it is available in node_modules
COPY prisma ./prisma
RUN npx prisma generate
