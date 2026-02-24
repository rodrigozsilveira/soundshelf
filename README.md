# SoundShelf

This project is a basic web application to publish music.

The frontend is built with React and communicates with a API developed using Express.js. The backend is responsible for user authentication, handling file uploads, generating signed URLs for streaming, and managing music metadata.

Audio files such as .mp3 and .wav are stored in a MinIO Storage. Instead of serving files directly, the backend generates temporary signed URLs that allow secure access to stored objects.

A NGINX reverse proxy sits in front of the application, routing requests to the frontend and backend services within a containerized environment.

The database is built with MongoDB.

The application is fully containerized using Docker, with each service (frontend, backend, database, object storage, and reverse proxy) running in its own isolated container and communicating over an internal network.

### Docker

<p align="center">
  <img src="https://github.com/user-attachments/assets/7bd5a580-89ec-4aef-8ceb-74955baf859f" width="900">
</p>

## Architecture Diagram

<p align="center">
  <img src="https://github.com/user-attachments/assets/9f6f362d-4b9e-4251-b5a2-6bf484f22fb4" width="900">
</p>

## Pages

The Home page displays songs from all users.

<p align="center">
  <img src="https://github.com/user-attachments/assets/adf87a2e-d0ca-4375-904a-4fee5c967553" width="1000">
</p>

The My Music page displays only the authenticated user’s uploads and allows deletion.

<p align="center">
  <img src="https://github.com/user-attachments/assets/9d02e109-4020-43fb-877f-b5ea2c168e1b" width="1000">
</p>

The Upload page.

<p align="center">
  <img src="https://github.com/user-attachments/assets/7019bff4-f919-4dab-b20c-da010af9da9a" width="1000">
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/a1950a2e-b39e-4b84-9480-71784daaa2f1" width="900">
</p>

---

This App was built as a final project for the Distributed Systems class.
