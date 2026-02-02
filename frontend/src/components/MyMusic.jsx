import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyMusic = () => {
  const [myMusic, setMyMusic] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMyMusic();
  }, []);

  const fetchMyMusic = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/my-music');
      setMyMusic(response.data);
    } catch (error) {
      console.error('Error fetching my music:', error);
      setMessage('Error loading your music');
    } finally {
      setLoading(false);
    }
  };

  const deleteMusic = async (musicId) => {
    if (!window.confirm('Are you sure you want to delete this music?')) {
      return;
    }

    try {
      await axios.delete(`/api/music/${musicId}`);
      setMessage('Music deleted successfully');
      fetchMyMusic(); // Refresh the list
    } catch (error) {
      console.error('Error deleting music:', error);
      setMessage('Error deleting music');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="my-music-container">
      <div className="my-music-header">
        <h2>My Uploaded Music</h2>
        <button onClick={fetchMyMusic} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="my-music-list">
        {loading ? (
          <div className="loading">Loading your music...</div>
        ) : myMusic.length === 0 ? (
          <div className="empty-state">
            <h3>No music uploaded yet</h3>
            <p>Upload your first song to see it here!</p>
          </div>
        ) : (
          myMusic.map((music) => (
            <div key={music._id} className="my-music-item">
              <div className="music-details">
                <h4>{music.title}</h4>
                <p className="artist">{music.artist}</p>
                <div className="music-meta">
                  <span>Original: {music.originalName}</span>
                  <span>Size: {formatFileSize(music.size)}</span>
                  <span>Uploaded: {formatDate(music.createdAt)}</span>
                </div>
              </div>
              <div className="music-actions">
                <button 
                  className="delete-btn"
                  onClick={() => deleteMusic(music._id)}
                  title="Delete this music"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyMusic;