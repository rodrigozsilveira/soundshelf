import React, { useState } from 'react';
import axios from 'axios';

const UploadMusic = () => {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    music: null
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    if (e.target.name === 'music') {
      setFormData({
        ...formData,
        music: e.target.files[0]
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.music) {
      setMessage('Please select a music file');
      return;
    }

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('artist', formData.artist);
    submitData.append('music', formData.music);

    try {
      setUploading(true);
      setMessage('');
      
      const response = await axios.post('/api/upload', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Music uploaded successfully!');
      setFormData({
        title: '',
        artist: '',
        music: null
      });
      
      // Clear file input
      document.getElementById('music-file').value = '';
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading music');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Music</h2>
      
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Artist:</label>
          <input
            type="text"
            name="artist"
            value={formData.artist}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Music File (MP3, WAV, etc.):</label>
          <input
            id="music-file"
            type="file"
            name="music"
            accept="audio/*"
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Music'}
        </button>
      </form>

      <div className="upload-info">
        <h3>Supported Formats:</h3>
        <ul>
          <li>MP3</li>
          <li>WAV</li>
          <li>OGG</li>
          <li>FLAC</li>
          <li>AAC</li>
        </ul>
        <p>Maximum file size: 50MB</p>
      </div>
    </div>
  );
};

export default UploadMusic;