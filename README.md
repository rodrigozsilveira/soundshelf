## This project is a basic web application to publish music. 

The frontend is built with React and communicates with a API built with Express (Node.js). The backend handles requests for uploading, listing, and deleting songs.

Audio files such as .mp3 and .wav are stored in an object storage service using MinIO. MinIO provides S3-compatible storage, and an Nginx server is used as a reverse proxy to expose and serve the stored files.

The DataBase s built with MongoDB.

The Home page displays songs from all users. The My Music page displays only the authenticated user’s uploads and allows deletion. The Upload page sends audio files to the backend, which stores them in the MinIO bucket and saves the file reference.
