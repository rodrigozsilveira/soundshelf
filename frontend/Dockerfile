# Build stage
FROM node:18-alpine AS builder

# Diretório correto para o frontend
WORKDIR /app

# Copiar apenas os arquivos essenciais primeiro (para cache eficiente)
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante do projeto
COPY . .

# Gerar build de produção
RUN npm run build

# -------------------------------------------------

# Stage final de produção
FROM nginx:alpine

# Copiar os arquivos estáticos do Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
