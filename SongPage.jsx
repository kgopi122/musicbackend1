import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  PiPlayFill, PiPauseFill, PiPlusCircleFill, PiDownloadSimple,
  PiSkipBackFill, PiSkipForwardFill, PiShuffleFill, PiRepeatFill, PiHeartFill
} from 'react-icons/pi';
import { requireAuth } from './utils/auth';
import { likedSongsApi, playlistSongsApi } from './api';

import './SongPage.css';
import './Playbar.css';
import Header from './header';
import { LibraryContext } from './LibraryContext';
import { PlayerContext } from './PlayerContext';
import { songs } from './data';

// Song video mapping
const songVideos = {
  'Tum Hi Ho': '/videos/tum-hi-ho.mp4',
  'Raabta': '/videos/raabta.mp4',
  'Kesariya': '/videos/kesariya.mp4',
  'Tum Se Hi': '/videos/tum-se-hi.mp4',
  'default': '/videos/default-music-bg.mp4'
};

const SongPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { song: initialSong, recommendedSongs: initialRecommendedSongs } = location.state || {};
  const [durations, setDurations] = useState({});
  const [addedSongIndex, setAddedSongIndex] = useState(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [currentLyrics, setCurrentLyrics] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const lyricsRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentVideo, setCurrentVideo] = useState('');
  const { songId } = useParams();
  const [currentTime, setCurrentTime] = useState(0);

  // Add state for feedback messages
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!requireAuth(navigate)) return;
  }, [songId, navigate]);

  const { likedSongs, setLikedSongs, playlistSongs, setPlaylistSongs } = useContext(LibraryContext);
  const {
    currentSong,
    setCurrentSong,
    isPlaying,
    setIsPlaying,
    handlePlayPause,
    handleNext,
    handlePrevious,
    setCurrentPlaylist,
    audioRef
  } = useContext(PlayerContext);

  // Combine main song with recommended songs and set up playlist
  useEffect(() => {
    if (initialSong) {
      // Get all songs from the same movie
      const movieSongs = songs.filter(song =>
        song.movieName === initialSong.movieName
      );

      // Sort songs to maintain consistent order
      const sortedMovieSongs = movieSongs.sort((a, b) => a.id - b.id);

      setAllSongs(sortedMovieSongs);

      // Set current video
      setCurrentVideo(songVideos[initialSong.title] || songVideos.default);

      // Set the initial playlist with only songs from the same movie
      setCurrentPlaylist(sortedMovieSongs);

      // Get songs with same artist or genre for "You May Also Like" section
      const similarSongs = songs.filter(song =>
        song.id !== initialSong.id && // Exclude current song
        (song.artist === initialSong.artist || song.genre === initialSong.genre)
      );

      // Sort similar songs by relevance (artist match first, then genre)
      const sortedSimilarSongs = similarSongs.sort((a, b) => {
        const aArtistMatch = a.artist === initialSong.artist;
        const bArtistMatch = b.artist === initialSong.artist;
        if (aArtistMatch && !bArtistMatch) return -1;
        if (!aArtistMatch && bArtistMatch) return 1;
        return 0;
      });

      // Update the recommended songs state
      setRecommendedSongs(sortedSimilarSongs);
    }
  }, [initialSong, setCurrentPlaylist]);

  // Add state for recommended songs
  const [recommendedSongs, setRecommendedSongs] = useState([]);

  // ✅ Preload durations (parallel and reliable)
  useEffect(() => {
    const loadDurations = async () => {
      const promises = allSongs.map((song, index) => {
        return new Promise((resolve) => {
          if (!song.audioSrc) {
            resolve({ index, duration: '--:--' });
            return;
          }

          const audio = new Audio();
          audio.preload = "metadata";

          const timeoutId = setTimeout(() => {
            resolve({ index, duration: song.duration || '--:--' });
          }, 3000);

          audio.addEventListener('loadedmetadata', () => {
            clearTimeout(timeoutId);
            resolve({
              index,
              duration: `${Math.floor(audio.duration / 60)}:${String(Math.floor(audio.duration % 60)).padStart(2, '0')}`
            });
          });

          audio.addEventListener('error', () => {
            clearTimeout(timeoutId);
            console.error(`Error loading audio for ${song.title}`);
            resolve({ index, duration: song.duration || '--:--' });
          });

          const fixedPath = song.audioSrc.startsWith('/') ? song.audioSrc : `/${song.audioSrc}`;
          audio.src = fixedPath;
        });
      });

      const results = await Promise.all(promises);
      const newDurations = {};
      results.forEach(({ index, duration }) => {
        newDurations[index] = duration;
      });
      setDurations(newDurations);
    };

    loadDurations();
  }, [allSongs]);

  // Handle recommended song click
  const handleRecommendedSongClick = (recSong, index, event) => {
    // Check if the click was on an action button or its children
    if (event.target.closest('.song-actions') || 
        event.target.closest('.add-download') || 
        event.target.closest('.action-button')) {
      return;
    }
    
    event.stopPropagation();
    
    // Create a new playlist starting from the clicked song
    const newPlaylist = songs.slice(index);
    setCurrentSong(recSong);
    setPlaylist(newPlaylist);
    play();
  };

  // Handle similar song click
  const handleSimilarSongClick = (similarSong, event) => {
    event.stopPropagation();

    // Create a new playlist with the similar song and other similar songs
    const similarSongsPlaylist = recommendedSongs.filter(song =>
      song.id !== similarSong.id
    );
    const newPlaylist = [similarSong, ...similarSongsPlaylist];
    setCurrentPlaylist(newPlaylist);

    setCurrentSong(similarSong);
    setIsPlaying(true);
  };

  // Handle next song in song page
  const handleNextSong = () => {
    const currentIndex = allSongs.findIndex(song => song.id === currentSong?.id);
    if (currentIndex < allSongs.length - 1) {
      const nextSong = allSongs[currentIndex + 1];
      setCurrentSong(nextSong);
      setIsPlaying(true);
      // Update playlist to maintain context with only movie songs
      const newPlaylist = allSongs.slice(currentIndex + 1);
      setCurrentPlaylist(newPlaylist);
    }
  };

  // Handle previous song in song page
  const handlePreviousSong = () => {
    const currentIndex = allSongs.findIndex(song => song.id === currentSong?.id);
    if (currentIndex > 0) {
      const prevSong = allSongs[currentIndex - 1];
      setCurrentSong(prevSong);
      setIsPlaying(true);
      // Update playlist to maintain context with only movie songs
      const newPlaylist = allSongs.slice(currentIndex - 1);
      setCurrentPlaylist(newPlaylist);
    }
  };

  // Show feedback message
  const showFeedbackMessage = (message) => {
    setFeedbackMessage(message);
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackMessage('');
    }, 2000);
  };

  // Handle like song
  const handleLikeSong = async (song) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showFeedbackMessage('Please login to like songs');
        return;
      }

      showFeedbackMessage('Updating like status...');

      const response = await fetch('/api/liked-songs/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          songId: song.id,
          songTitle: song.title,
          artist: song.artist,
          movieName: song.movieName,
          imageUrl: song.image,
          audioSrc: song.audioSrc
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like status');
      }

      const data = await response.json();
      if (data.liked) {
        setLikedSongs([...likedSongs, song]);
        showFeedbackMessage('Song added to liked songs!');
      } else {
        setLikedSongs(likedSongs.filter(s => s.id !== song.id));
        showFeedbackMessage('Song removed from liked songs');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showFeedbackMessage('Error updating like status');
    }
  };

  // Handle add to playlist
  const handleAddToPlaylist = async (song, index) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showFeedbackMessage('Please login to add songs to playlist');
        return;
      }

      showFeedbackMessage('Adding to playlist...');

      const response = await fetch('/api/playlist-songs/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          songId: song.id,
          songTitle: song.title,
          artist: song.artist,
          movieName: song.movieName,
          imageUrl: song.image,
          audioSrc: song.audioSrc
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add to playlist');
      }

      const data = await response.json();
      if (data.added) {
        setPlaylistSongs([...playlistSongs, song]);
        setAddedSongIndex(index);
        showFeedbackMessage('Song added to playlist!');
        setTimeout(() => setAddedSongIndex(null), 2000);
      } else {
        showFeedbackMessage('Song is already in playlist');
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
      showFeedbackMessage('Error adding to playlist');
    }
  };

  const isLiked = (song) => likedSongs.some(s => s.id === song.id);
  const isInPlaylist = (song) => playlistSongs.some(s => s.id === song.id);

  const toggleLyrics = () => {
    setShowLyrics(!showLyrics);
    if (!showLyrics && currentSong) {
      const lyrics = songLyrics[currentSong.title] || songLyrics.default;
      setCurrentLyrics(lyrics);
    }
  };

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  const handleVideoError = (e) => {
    console.error('Video error:', e);
    setCurrentVideo(songVideos.default);
  };

  // Sample lyrics for songs
  const songLyrics = {
    'Tum Hi Ho': [
      { time: 0, text: "Tum hi ho, tum hi ho" },
      { time: 4, text: "Aashiqui hai tum hi ho" },
      { time: 8, text: "Tum hi ho, tum hi ho" },
      { time: 12, text: "Aashiqui hai tum hi ho" },
      { time: 16, text: "Tum hi ho, tum hi ho" },
      { time: 20, text: "Aashiqui hai tum hi ho" },
      { time: 24, text: "Tum hi ho, tum hi ho" },
      { time: 28, text: "Aashiqui hai tum hi ho" }
    ],
    'Raabta': [
      { time: 0, text: "Raabta, raabta, raabta" },
      { time: 4, text: "Tere sang yaara" },
      { time: 8, text: "Raabta, raabta, raabta" },
      { time: 12, text: "Tere sang yaara" },
      { time: 16, text: "Raabta, raabta, raabta" },
      { time: 20, text: "Tere sang yaara" },
      { time: 24, text: "Raabta, raabta, raabta" },
      { time: 28, text: "Tere sang yaara" }
    ],
    'Kesariya': [
      { time: 0, text: "Kesariya, kesariya" },
      { time: 4, text: "Tera ishq hai piya" },
      { time: 8, text: "Kesariya, kesariya" },
      { time: 12, text: "Tera ishq hai piya" },
      { time: 16, text: "Kesariya, kesariya" },
      { time: 20, text: "Tera ishq hai piya" },
      { time: 24, text: "Kesariya, kesariya" },
      { time: 28, text: "Tera ishq hai piya" }
    ],
    'Tum Se Hi': [
      { time: 0, text: "Tum se hi, tum se hi" },
      { time: 4, text: "Dil ko hai aaram" },
      { time: 8, text: "Tum se hi, tum se hi" },
      { time: 12, text: "Dil ko hai aaram" },
      { time: 16, text: "Tum se hi, tum se hi" },
      { time: 20, text: "Dil ko hai aaram" },
      { time: 24, text: "Tum se hi, tum se hi" },
      { time: 28, text: "Dil ko hai aaram" }
    ],
    'default': [
      { time: 0, text: "This is the beginning of the song" },
      { time: 4, text: "Where the melody starts to flow" },
      { time: 8, text: "And the rhythm takes control" },
      { time: 12, text: "As the music starts to grow" },
      { time: 16, text: "Feel the beat in your soul" },
      { time: 20, text: "Let the harmony unfold" },
      { time: 24, text: "As the story is told" },
      { time: 28, text: "Through the music we know" }
    ]
  };

  // Update current time and lyrics
  useEffect(() => {
    if (!audioRef.current) return;

    const updateTime = () => {
      setCurrentTime(audioRef.current.currentTime);
    };

    audioRef.current.addEventListener('timeupdate', updateTime);
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateTime);
      }
    };
  }, [audioRef]);

  // Update current lyrics based on time
  useEffect(() => {
    if (!currentSong) return;

    const lyrics = songLyrics[currentSong.title] || songLyrics.default;
    const currentLyricIndex = lyrics.findIndex(lyric => lyric.time > currentTime) - 1;
    setCurrentLyricIndex(currentLyricIndex >= 0 ? currentLyricIndex : 0);
    setCurrentLyrics(lyrics);
  }, [currentTime, currentSong]);

  // Update song details when currentSong changes
  useEffect(() => {
    if (currentSong) {
      // Update video
      setCurrentVideo(songVideos[currentSong.title] || songVideos.default);

      // Update lyrics
      if (currentSong.lyrics) {
        const lyricsLines = currentSong.lyrics.split('\n').map(line => ({ text: line }));
        setCurrentLyrics(lyricsLines);
      } else {
        const lyrics = songLyrics[currentSong.title] || songLyrics.default;
        setCurrentLyrics(lyrics);
      }

      // Update playlist to maintain song page context with only movie songs
      const currentIndex = allSongs.findIndex(song => song.id === currentSong.id);
      if (currentIndex !== -1) {
        const newPlaylist = allSongs.slice(currentIndex);
        setCurrentPlaylist(newPlaylist);
      }
    }
  }, [currentSong, allSongs, setCurrentPlaylist]);

  const handleDownload = async (quality) => {
    try {
      showToast('Preparing download...', 'info');
      // ... download logic ...
      a.download = `${selectedSong.title} - ${quality.label}.wav`;
      // ... rest of the function ...
    } catch (error) {
      console.error('Download error:', error);
      showToast('Download failed. Please try again.', 'error');
    }
  };

  // Check liked and playlist status on component load
  useEffect(() => {
    const checkSongStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Check liked status for all songs
        const likedPromises = allSongs.map(song =>
          fetch(`/api/liked-songs/check/${song.id}`, {
            headers: { 'Authorization': token }
          }).then(res => res.json())
        );

        // Check playlist status for all songs
        const playlistPromises = allSongs.map(song =>
          fetch(`/api/playlist-songs/check/${song.id}`, {
            headers: { 'Authorization': token }
          }).then(res => res.json())
        );

        const [likedResults, playlistResults] = await Promise.all([
          Promise.all(likedPromises),
          Promise.all(playlistPromises)
        ]);

        // Update liked songs
        const newLikedSongs = allSongs.filter((song, index) => likedResults[index].liked);
        setLikedSongs(newLikedSongs);

        // Update playlist songs
        const newPlaylistSongs = allSongs.filter((song, index) => playlistResults[index].inPlaylist);
        setPlaylistSongs(newPlaylistSongs);
      } catch (error) {
        console.error('Error checking song status:', error);
      }
    };

    if (allSongs.length > 0) {
      checkSongStatus();
    }
  }, [allSongs]);

  if (!initialSong) {
    return <div>Song not found</div>;
  }

  return (
    <div id="songPage">
      {showFeedback && (
        <div className="feedback-message">
          {feedbackMessage}
        </div>
      )}
      <div id="songPage-main-content">
        <div id="songPage-song-details">
          <div className="background-video-container">
            {!videoLoaded && <div className="video-loading">Loading video...</div>}
            <video
              src={currentVideo}
              className={`background-video ${videoLoaded ? 'loaded' : ''}`}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
            />
            <div className="video-overlay"></div>
          </div>
          <div id="songPage-song-details-container">
            <div className="song-details-main">
              <div className="songPage-song-image-container">
                <img src={currentSong?.image || initialSong?.image} alt={currentSong?.title || initialSong?.title} />
              </div>
              <div id="songPage-song-info">
                <h2>{currentSong?.title || initialSong?.title}</h2>
                <p className="artist-name" style={{ color: 'green', cursor: 'pointer' }}>{currentSong?.artist || initialSong?.artist}</p>
                <p className="movie-name" style={{ cursor: 'pointer' }}>{currentSong?.movieName || initialSong?.movieName}</p>
                <p>{currentSong?.year || initialSong?.year}</p>
                <button
                  className={`show-lyrics-button ${showLyrics ? 'active' : ''}`}
                  onClick={toggleLyrics}
                >
                  {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
                </button>
              </div>
            </div>

            {showLyrics && (
              <div className="lyrics-section">
                <div className="lyrics-content" ref={lyricsRef}>
                  {currentLyrics.map((line, index) => (
                    <p
                      key={index}
                      className={`lyrics-line ${currentLyricIndex === index ? 'active' : ''}`}
                    >
                      {line.text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div id="recommended-songs">
          <h3>Songs from {initialSong.movieName}</h3>
          <div className="recommended-songs-list">
            {allSongs
              .filter(recSong => recSong.id !== initialSong.id)
              .map((recSong, index) => (
                <div
                  key={recSong.id}
                  className={`recommended-song-item ${currentSong?.id === recSong.id ? 'selected-song' : ''}`}
                  onClick={(e) => {
                    // Only play if not clicking on buttons
                    if (!e.target.closest('.song-actions') && 
                        !e.target.closest('.add-download') && 
                        !e.target.closest('.action-button')) {
                      handleRecommendedSongClick(recSong, index, e);
                    }
                  }}
                >
                  <div className="recommended-song-info">
                    <img src={recSong.image} alt={recSong.title} />
                    <div>
                      <h4>{recSong.title}</h4>
                      <p className="artist-name" style={{ color: 'green', cursor: 'pointer' }}>{recSong.artist}</p>
                    </div>
                  </div>
                  <div className="add-download">
                    <button
                      className={`control-button-like ${isLiked(recSong) ? 'liked' : ''}`}
                      onClick={(e) => handleLikeSong(recSong)}
                    >
                      <PiHeartFill />
                    </button>
                    <button
                      className={`song-action-button ${isInPlaylist(recSong) ? 'added' : ''}`}
                      onClick={(e) => handleAddToPlaylist(recSong, index)}
                    >
                      <PiPlusCircleFill />
                    </button>
                    <button className="song-action-button">
                      <PiDownloadSimple />
                    </button>
                    <span className="duration">{durations[index] || '--:--'}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div id="you-may-also-like">
          <h3>You May Also Like</h3>
          <div className="horizontal-songs-list">
            {recommendedSongs.map((similarSong) => (
              <div
                key={similarSong.id}
                className="horizontal-song-card"
                onClick={(e) => handleSimilarSongClick(similarSong, e)}
              >
                <div className="song-image-container">
                  <img src={similarSong.image} alt={similarSong.title} />
                  <div className="song-overlay">
                    <button
                      className={`play-button ${currentSong?.id === similarSong.id && isPlaying ? 'playing' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimilarSongClick(similarSong, e);
                      }}
                    >
                      {currentSong?.id === similarSong.id && isPlaying ? <PiPauseFill /> : <PiPlayFill />}
                    </button>
                  </div>
                </div>
                <div className="song-info">
                  <div id='you-may-also-like-song-info'>
                    <h4>{similarSong.title}</h4>
                    <p className="artist-name" style={{ color: 'green', cursor: 'pointer' }}>{similarSong.artist}</p>
                    <p className="movie-name song-meta" style={{ cursor: 'pointer' }}>{similarSong.movieName}</p>
                    <p className="genre song-meta">{similarSong.genre}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongPage;
