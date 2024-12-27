# Homelab Dashboard

A straightforward dashboard for various services running on my homelab.  
Apart from providing links to services, it is used to a start, stop and check the status of a Minecraft server.

The API server is used to interact with the Minecraft server.  
It runs as a service via `systemctl` and provides a websocket connection for real-time interactions.  
The frontend is hosted via Nginx running in a Docker container.

I've partly used this project as a practice for various refactors defined in Refactoring by Martin Fowler.

## Tech
Made with HTML, CSS, JS

Styling: PicoCSS  
Tooling: Vite  
API: Fastify  

## Development & Deployment
Install dependencies and put required values in .env  
Use `npm run dev` for frontend and `npm run server` for for Fastify API.

Use `npm run build` for deployment.  
If the container is running, nothing else is needed.  
It mounts the `dist` folder to Nginx so do a hard refresh and get the latest build immediately.  
