sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/ollama-selfsigned.key \
  -out /etc/ssl/certs/ollama-selfsigned.crt \
  -subj "/C=ES/ST=State/L=City/O=Organization/CN=hackaton-cubepath.d0w.dev"
