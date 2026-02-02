import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MusicPlayer = () => {
  const [musicList, setMusicList] = useState([]);
  const [currentMusic, setCurrentMusic] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  // Inicializa como null, o React preencherá com o elemento <audio>
  const audioRef = useRef(null);

  useEffect(() => {
    fetchMusic();
  }, []);

  const fetchMusic = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/music');
      setMusicList(response.data);
    } catch (error) {
      console.error('Error fetching music:', error);
      setError('Error loading music library');
    } finally {
      setLoading(false);
    }
  };

  const getStreamUrl = async (musicId) => {
    try {
      const response = await axios.get(`/api/music/${musicId}/stream`);
      if (!response.data.url) throw new Error('No stream URL received');
      return response.data.url;
    } catch (error) {
      console.error('Error getting stream URL:', error);
      throw new Error('Could not get music stream');
    }
  };

  const playMusic = async (music) => {
    const audio = audioRef.current;
    if (!audio) return;

    // CASO 1: Clicou na música que já está tocando (Pause/Resume)
    if (currentMusic && currentMusic._id === music._id) {
      if (isPlaying) {
        audio.pause();
      } else {
        try {
          await audio.play();
        } catch (e) {
          console.error("Resume error:", e);
        }
      }
      return;
    }

    // CASO 2: Troca de música
    try {
      setError('');
      setIsLoadingAudio(true);
      
      // 1. Pausa a atual imediatamente
      audio.pause();

      // 2. Busca a nova URL
      const streamUrl = await getStreamUrl(music._id);

      // 3. Atualiza estado visual
      setCurrentMusic(music);

      // 4. Configura a nova fonte e carrega
      audio.src = streamUrl;
      audio.load();

      // 5. Tenta tocar
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Sucesso, áudio tocando
          })
          .catch(error => {
            // Ignora erros de interrupção (troca rápida de música)
            if (error.name === 'AbortError') {
              console.log('Playback aborted due to track change (expected behavior).');
            } else if (error.name === 'NotAllowedError') {
              setError('Click play to start audio (browser restriction).');
            } else {
              console.error('Playback error:', error);
              setError('Error playing audio.');
            }
          });
      }

    } catch (error) {
      console.error('Error setup music:', error);
      setError(error.message);
      setIsLoadingAudio(false);
    }
  };

  // --- Handlers de Eventos de Áudio (Nativos) ---
  
  const onPlay = () => setIsPlaying(true);
  
  const onPause = () => setIsPlaying(false);
  
  const onEnded = () => setIsPlaying(false);
  
  const onLoadStart = () => setIsLoadingAudio(true);
  
  const onLoadedData = () => setIsLoadingAudio(false); // Dados suficientes para começar
  
  const onError = (e) => {
    // Evita mostrar erro se for apenas um cancelamento de carga anterior
    if (audioRef.current && audioRef.current.error && audioRef.current.error.code !== 20) {
        console.error('Audio Tag Error:', e);
        setIsLoadingAudio(false);
        setIsPlaying(false);
        // Opcional: setError('Error loading audio file.'); 
    }
  };

  // --- Formatadores ---

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="music-player">
      <div className="player-header">
        <h2>Music Library</h2>
        <button onClick={fetchMusic} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {/* Player Controls (Sempre renderizado, mas visível apenas se houver música) */}
      <div className={`current-player ${currentMusic ? 'visible' : 'hidden'}`} style={{ display: currentMusic ? 'block' : 'none' }}>
        {currentMusic && (
            <h3>Now Playing: {currentMusic.title} - {currentMusic.artist}</h3>
        )}
        <div className="player-controls">
          <audio
            ref={audioRef}
            controls
            className="audio-player"
            preload="metadata"
            // Eventos ligados diretamente aqui (Maneira React correta)
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            onLoadStart={onLoadStart}
            onLoadedData={onLoadedData}
            onError={onError}
          />
          {isLoadingAudio && (
            <div className="loading-audio">
              Loading audio...
            </div>
          )}
        </div>
      </div>

      <div className="music-list">
        {loading ? (
          <div className="loading">Loading music library...</div>
        ) : musicList.length === 0 ? (
          <p>No music available. Be the first to upload a song!</p>
        ) : (
          musicList.map((music) => (
            <div
              key={music._id}
              className={`music-item ${currentMusic?._id === music._id ? 'active' : ''}`}
              onClick={() => playMusic(music)}
            >
              <div className="music-info">
                <h4>{music.title}</h4>
                <p>{music.artist}</p>
                <small>
                  Uploaded by {music.uploadedBy?.username} on {formatDate(music.createdAt)} • {formatFileSize(music.size)}
                </small>
              </div>
              <div className="play-button">
                {currentMusic?._id === music._id ? (
                  isLoadingAudio ? '⏳' : 
                  isPlaying ? '⏸️' : '▶️'
                ) : '▶️'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;