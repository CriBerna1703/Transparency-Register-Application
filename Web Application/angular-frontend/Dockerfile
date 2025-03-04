FROM nginx:latest

RUN rm -rf /etc/nginx/conf.d
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/angular-frontend/ /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
