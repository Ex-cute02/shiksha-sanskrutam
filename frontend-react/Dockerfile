FROM nginx:alpine

# Copy built frontend into nginx html directory. Ensure `frontend-react/dist` exists.
COPY dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["/usr/sbin/nginx", "-g", "daemon off;"]
