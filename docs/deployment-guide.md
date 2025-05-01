# Smart Examination System - Deployment Guide

This guide provides instructions for deploying the Smart Examination System in various environments, from development to production.

## Prerequisites

- Node.js (v16+)
- MongoDB (v5+)
- OpenAI API key
- SMTP server details (for email notifications)
- Docker and Docker Compose (for containerized deployment)

## Local Development Deployment

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd /path/to/online-evaluation/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your specific configuration:
   - Database connection string
   - JWT secret
   - OpenAI API key
   - SMTP settings
   - Admin credentials

4. Start the development server:
   ```bash
   npm run dev
   ```
   This will start the server with nodemon for automatic reloading.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd /path/to/online-evaluation/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your specific configuration:
   - API URL
   - Notification timing

4. Start the development server:
   ```bash
   npm start
   ```
   This will start the React development server and open the application in your browser.

## Docker Deployment

Docker provides a containerized deployment option that ensures consistency across different environments.

1. Navigate to the project root:
   ```bash
   cd /path/to/online-evaluation
   ```

2. Configure environment variables for both backend and frontend as described above.

3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```
   This will build the images and start the containers in detached mode.

4. Check the container status:
   ```bash
   docker-compose ps
   ```

5. View logs if needed:
   ```bash
   docker-compose logs -f
   ```

6. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## Production Deployment

For production deployment, additional configuration is recommended for security, performance, and reliability.

### Backend Production Setup

1. Set environment variables:
   ```bash
   NODE_ENV=production
   ```
   This enables production-specific optimizations.

2. Configure secure CORS settings:
   ```
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. Set up a production-ready MongoDB instance:
   - Enable authentication
   - Configure replica sets for redundancy
   - Set up regular backups

4. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "smart-exam-backend"
   ```

5. Set up NGINX as a reverse proxy:
   ```nginx
   server {
     listen 80;
     server_name api.your-domain.com;
     
     location / {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

6. Enable HTTPS with Let's Encrypt:
   ```bash
   certbot --nginx -d api.your-domain.com
   ```

### Frontend Production Setup

1. Build the production bundle:
   ```bash
   cd /path/to/online-evaluation/frontend
   npm run build
   ```

2. Deploy the static files to a web server or CDN.

3. For NGINX:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     
     root /path/to/online-evaluation/frontend/build;
     index index.html;
     
     location / {
       try_files $uri /index.html;
     }
   }
   ```

4. Enable HTTPS with Let's Encrypt:
   ```bash
   certbot --nginx -d your-domain.com
   ```

## Cloud Deployment Options

### AWS Deployment

1. **EC2 Instances**:
   - Launch t3.medium instances for backend
   - Configure security groups
   - Set up an Application Load Balancer

2. **MongoDB Atlas** for database:
   - Create a cluster
   - Configure VPC peering for secure access

3. **S3 + CloudFront** for frontend:
   - Upload built frontend to S3 bucket
   - Configure CloudFront distribution
   - Set up custom domain

4. **Route 53** for DNS management:
   - Create A records for your domains
   - Set up health checks

### Azure Deployment

1. **App Service** for backend:
   - Create a Node.js App Service
   - Configure environment variables
   - Set up Deployment Center

2. **Cosmos DB** with MongoDB API:
   - Create a Cosmos DB account
   - Configure throughput

3. **Static Web Apps** for frontend:
   - Connect to your GitHub repository
   - Configure build settings

4. **Azure DNS** for domain management

### Digital Ocean Deployment

1. **Droplets** for backend and MongoDB:
   - Create Ubuntu 20.04 droplets
   - Configure firewall rules

2. **App Platform** for managed deployment:
   - Connect to your GitHub repository
   - Configure environment variables

3. **Spaces** for static frontend hosting:
   - Upload built frontend
   - Configure CDN

## Scaling Considerations

1. **Backend Scaling**:
   - Horizontal scaling with load balancing
   - Caching with Redis for common requests
   - Rate limiting to protect API endpoints

2. **Database Scaling**:
   - Sharding for horizontal scaling
   - Read replicas for read-heavy workloads
   - Proper indexing for performance

3. **LLM API Usage**:
   - Implement queue system for LLM requests
   - Caching common prompts and responses
   - Fallback mechanisms for API failures

4. **Monitoring and Alerting**:
   - Set up application monitoring (e.g., New Relic, Datadog)
   - Configure log aggregation (e.g., ELK stack)
   - Create alerts for critical issues

## Maintenance Tasks

1. **Database Maintenance**:
   - Regular backups
   - Index optimization
   - Data archiving for old exams

2. **Security Updates**:
   - Regular dependency updates
   - Security patches
   - Vulnerability scanning

3. **Performance Optimization**:
   - API endpoint profiling
   - Database query optimization
   - Frontend bundle optimization

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**:
   - Check connection string
   - Verify network connectivity
   - Confirm authentication credentials

2. **LLM API Errors**:
   - Verify API key
   - Check rate limits
   - Monitor quota usage

3. **JWT Authentication Issues**:
   - Verify JWT secret
   - Check token expiration
   - Confirm proper token format

4. **Frontend API Connection Issues**:
   - Check CORS settings
   - Verify API URL configuration
   - Test API endpoints with Postman

### Logs and Debugging

1. **Backend Logs**:
   - Check `logs/combined.log` for general logs
   - Check `logs/error.log` for error specific logs

2. **Docker Logs**:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   docker-compose logs mongodb
   ```

3. **Production Logs**:
   ```bash
   pm2 logs smart-exam-backend
   ```

## Backup and Disaster Recovery

1. **Database Backups**:
   - Configure automated MongoDB backups
   - Store backups in secure, off-site location
   - Test restoration process periodically

2. **Configuration Backups**:
   - Back up all `.env` files securely
   - Document environment-specific configurations

3. **Disaster Recovery Plan**:
   - Document step-by-step recovery procedures
   - Set recovery time objectives (RTO)
   - Conduct periodic recovery drills

## Conclusion

This deployment guide covers the basics of deploying the Smart Examination System in different environments. Adapt these instructions to your specific infrastructure requirements and organizational policies. For production deployments, always prioritize security, reliability, and performance.
