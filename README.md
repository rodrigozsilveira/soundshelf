## This project is a basic web application to publish music. 

The frontend is built with React and communicates with a API built with Express (Node.js). The backend handles requests for uploading, listing, and deleting songs.

Audio files such as .mp3 and .wav are stored in an object storage service using MinIO. MinIO provides S3-compatible storage, and an Nginx server is used as a reverse proxy to expose and serve the stored files.

The DataBase s built with MongoDB.

Diagram
---
<img width="1206" height="397" alt="Image" src="https://github.com/user-attachments/assets/9f6f362d-4b9e-4251-b5a2-6bf484f22fb4" />

The Home page displays songs from all users. The My Music page displays only the authenticated user’s uploads and allows deletion. The Upload page sends audio files to the backend, which stores them in the MinIO bucket and saves the file reference.
<img width="1351" height="628" alt="Image" src="https://github.com/user-attachments/assets/adf87a2e-d0ca-4375-904a-4fee5c967553" />
<img width="1343" height="634" alt="Image" src="https://github.com/user-attachments/assets/9d02e109-4020-43fb-877f-b5ea2c168e1b" />
<img width="1158" height="118" alt="Image" src="https://github.com/user-attachments/assets/a1950a2e-b39e-4b84-9480-71784daaa2f1" />
