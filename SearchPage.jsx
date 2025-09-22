import React, { useState, useEffect, useContext, useRef } from 'react';
import './SearchPage.css';
import './SongPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faPlay, faPause, faHeart, faPlus, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { PiPlusCircleFill, PiDownloadSimple } from 'react-icons/pi';
import { songs, searchSongs } from './data';
import { useNavigate } from 'react-router-dom';
import './styles/Search.css';
import { PlayerContext } from './PlayerContext';
import { LibraryContext } from './LibraryContext';
import DownloadQualityDropdown from './components/DownloadQualityModal';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [durations, setDurations] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [relatedSongs, setRelatedSongs] = useState([]);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  const [dropdownSuggestions, setDropdownSuggestions] = useState([]);
  const [dropdownActiveIndex, setDropdownActiveIndex] = useState(-1);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [downloadPosition, setDownloadPosition] = useState({ top: 0, left: 0 });

  const navigate = useNavigate();
  
  // Use PlayerContext for playback
  const { 
    currentSong, 
    setCurrentSong, 
    isPlaying, 
    setIsPlaying, 
    setCurrentPlaylist,
    handlePlayPause
  } = useContext(PlayerContext);
  
  // Use LibraryContext for favorites and playlists
  const { likedSongs, setLikedSongs, playlistSongs, setPlaylistSongs } = useContext(LibraryContext);

  // Function to get all songs including those in recommended songs
  const getAllSongsIncludingRecommended = () => {
    const allSongs = [...songs];
    const processedSongIds = new Set();
    
    // Helper function to recursively process songs
    const processSong = (song) => {
      if (!song || processedSongIds.has(song.id)) return;
      
      processedSongIds.add(song.id);
      
      if (song.recommendedSongs && Array.isArray(song.recommendedSongs)) {
        song.recommendedSongs.forEach(recSong => {
          // Check if this is a recommended song object with its own properties
          if (recSong && typeof recSong === 'object' && recSong.id) {
            // Add the recommended song if it's not already in the list
            if (!allSongs.some(s => s.id === recSong.id)) {
              allSongs.push(recSong);
              // Recursively process this recommended song
              processSong(recSong);
            }
          }
        });
      }
    };
    
    // Process all songs
    songs.forEach(processSong);
    
    return allSongs;
  };

  // Initialize search results with all songs
  useEffect(() => {
    const allSongs = getAllSongsIncludingRecommended();
    setSearchResults(allSongs);
  }, []);

  // Function to calculate text width using the input's computed font
  const calculateTextWidth = (text) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    let font = '16px inherit';
    if (inputRef.current) {
      const computed = window.getComputedStyle(inputRef.current);
      font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    }
    context.font = font;
    return context.measureText(text).width;
  };

  // Handle search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsLoading(true);

    // Calculate the width of the input text using the actual input font
    const textWidth = calculateTextWidth(query);
    document.documentElement.style.setProperty('--input-width', `${textWidth}px`);

    if (query.trim() === '') {
      setSuggestion(''); // Clear suggestion immediately
      const allSongs = getAllSongsIncludingRecommended();
      setSearchResults(allSongs);
      setIsLoading(false);
      return;
    }

    // Perform search with debounce
    setTimeout(() => {
      // Get all songs including recommended ones
      const allSongs = getAllSongsIncludingRecommended();
      
      // Filter songs based on the search query
      const filteredResults = allSongs.filter(song => {
        const searchableText = `${song.title} ${song.artist} ${song.movieName || ''} ${song.genre || ''}`.toLowerCase();
        return searchableText.includes(query.toLowerCase());
      });
      
      // Find the most relevant suggestion
      if (filteredResults.length > 0) {
        // Find the best match by checking which field matches the query
        const bestMatch = filteredResults.reduce((best, current) => {
          const currentTitle = current.title.toLowerCase();
          const currentArtist = current.artist.toLowerCase();
          const currentMovie = (current.movieName || '').toLowerCase();
          const queryLower = query.toLowerCase();

          // Check if any field starts with the query
          const titleStartsWith = currentTitle.startsWith(queryLower);
          const artistStartsWith = currentArtist.startsWith(queryLower);
          const movieStartsWith = currentMovie.startsWith(queryLower);

          // If any field starts with the query, it's a better match
          if (titleStartsWith || artistStartsWith || movieStartsWith) {
            // Choose the field that starts with the query
            if (titleStartsWith) return { ...current, matchField: 'title' };
            if (artistStartsWith) return { ...current, matchField: 'artist' };
            if (movieStartsWith) return { ...current, matchField: 'movieName' };
          }

          return best;
        }, null);

        if (bestMatch) {
          // Get the remaining text based on which field matched
          let remainingText = '';
          switch (bestMatch.matchField) {
            case 'title':
              remainingText = bestMatch.title.slice(query.length);
              break;
            case 'artist':
              remainingText = bestMatch.artist.slice(query.length);
              break;
            case 'movieName':
              remainingText = bestMatch.movieName.slice(query.length);
              break;
          }
          setSuggestion(remainingText);
        } else {
          setSuggestion('');
        }
      } else {
        setSuggestion('');
      }
      
      setSearchResults(filteredResults);
      setIsLoading(false);
    }, 300); // 300ms debounce
  };

  // Handle suggestion click
  const handleSuggestionClick = () => {
    if (suggestion) {
      const fullSuggestion = searchQuery + suggestion;
      setSearchQuery(fullSuggestion);
      handleSearch(fullSuggestion);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setSuggestion('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle song selection and playback
  const handleSongClick = (song) => {
    setCurrentSong(song);
    setCurrentPlaylist(searchResults);
    setIsPlaying(true);
    
    // Find related songs based on movie name and genre
    const allSongs = getAllSongsIncludingRecommended();
    const related = allSongs.filter(s => 
      s.id !== song.id && // Exclude current song
      ((s.movieName && song.movieName && s.movieName === song.movieName) || // Same movie
       (s.genre && song.genre && s.genre === song.genre)) // Same genre
    );
    setRelatedSongs(related);
  };

  // Handle favorite toggle
  const toggleFavorite = async (songId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please login to like songs', 'error');
        return;
      }

      const songToToggle = songs.find(s => s.id === songId);
      if (!songToToggle) return;

      const response = await fetch('/api/liked-songs/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          songId: songToToggle.id,
          songTitle: songToToggle.title,
          artist: songToToggle.artist,
          movieName: songToToggle.movieName,
          imageUrl: songToToggle.image,
          audioSrc: songToToggle.audioSrc
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like status');
      }

      const data = await response.json();
      
      // Update local state
      const updatedSongs = searchResults.map(song => 
        song.id === songId ? { ...song, isFavorite: data.liked } : song
      );
      setSearchResults(updatedSongs);
      
      // Update liked songs in LibraryContext
      if (data.liked) {
        setLikedSongs([...likedSongs, songToToggle]);
        showToast('Song added to favorites!', 'success');
      } else {
        setLikedSongs(likedSongs.filter(s => s.id !== songId));
        showToast('Song removed from favorites', 'info');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Error updating favorite status', 'error');
    }
  };

  // Handle add to playlist
  const addToPlaylist = async (songId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please login to add songs to playlist', 'error');
        return;
      }

      const songToAdd = songs.find(s => s.id === songId);
      if (!songToAdd) return;

      const response = await fetch('/api/playlist-songs/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          songId: songToAdd.id,
          songTitle: songToAdd.title,
          artist: songToAdd.artist,
          movieName: songToAdd.movieName,
          imageUrl: songToAdd.image,
          audioSrc: songToAdd.audioSrc
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add to playlist');
      }

      const data = await response.json();
      
      if (data.added) {
        setPlaylistSongs([...playlistSongs, songToAdd]);
        showToast('Song added to playlist!', 'success');
      } else {
        showToast('Song is already in playlist', 'info');
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
      showToast('Error adding to playlist', 'error');
    }
  };

  // Preload durations
  useEffect(() => {
    searchResults.forEach((song, index) => {
      const audio = new Audio(song.audioSrc);
      audio.onloadedmetadata = () => {
        setDurations(prev => ({
          ...prev,
          [index]: `${Math.floor(audio.duration / 60)}:${String(Math.floor(audio.duration % 60)).padStart(2, '0')}`
        }));
      };
    });
  }, [searchResults]);

  // Update dropdown suggestions on search
  useEffect(() => {
    if (!searchQuery) {
      setDropdownSuggestions([]);
      setDropdownActiveIndex(-1);
      return;
    }
    const allSongs = getAllSongsIncludingRecommended();
    const queryLower = searchQuery.toLowerCase();
    // Collect unique suggestions from title, artist, movieName
    const allFields = allSongs.flatMap(song => [
      { type: 'title', value: song.title, song },
      { type: 'artist', value: song.artist, song },
      { type: 'movieName', value: song.movieName || '', song }
    ]);
    // Filter and deduplicate
    const filtered = allFields.filter(
      field => field.value && field.value.toLowerCase().includes(queryLower)
    );
    // Remove duplicates by value+type
    const unique = [];
    const seen = new Set();
    for (const item of filtered) {
      const key = item.type + ':' + item.value;
      if (!seen.has(key)) {
        unique.push(item);
        seen.add(key);
      }
    }
    // Remove suggestions that exactly match the searchQuery (case-insensitive)
    const notExactMatch = unique.filter(item => item.value.toLowerCase() !== queryLower);
    setDropdownSuggestions(notExactMatch.slice(0, 5));
    setDropdownActiveIndex(-1);
  }, [searchQuery, songs]);

  // Keyboard navigation for dropdown
  const handleKeyDown = (e) => {
    if (dropdownSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setDropdownActiveIndex(idx => (idx + 1) % dropdownSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setDropdownActiveIndex(idx => (idx - 1 + dropdownSuggestions.length) % dropdownSuggestions.length);
      } else if (e.key === 'Enter' && dropdownActiveIndex >= 0) {
        e.preventDefault();
        setDropdownSuggestions([]);
        setDropdownActiveIndex(-1);
        const selected = dropdownSuggestions[dropdownActiveIndex];
        setSearchQuery(selected.value);
        handleSearch(selected.value);
        return;
      }
    }
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      const fullSuggestion = searchQuery + suggestion;
      setSearchQuery(fullSuggestion);
      handleSearch(fullSuggestion);
    }
  };

  // Click on dropdown suggestion
  const handleDropdownClick = (value) => {
    setDropdownSuggestions([]);
    setDropdownActiveIndex(-1);
    setSearchQuery(value);
    handleSearch(value);
  };

  // Highlight matching part
  const highlightMatch = (text, query) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return <>
      {text.slice(0, idx)}
      <span className="dropdown-highlight">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>;
  };

  // Helper function to convert size string to bytes
  const parseSizeToBytes = (sizeStr) => {
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };
    const [size, unit] = sizeStr.split(' ');
    return parseFloat(size) * units[unit];
  };

  // Helper function to compress audio
  const compressAudio = async (audioBuffer, targetSize) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    // Calculate the exact number of samples needed for target size
    const headerSize = 44; // WAV header size
    const bytesPerSample = 2; // 16-bit audio
    const availableSize = targetSize - headerSize;
    const totalSamples = Math.floor(availableSize / (numChannels * bytesPerSample));

    // Create a new buffer with exact size
    const newBuffer = new AudioBuffer({
      numberOfChannels: numChannels,
      length: totalSamples,
      sampleRate: sampleRate
    });

    // Calculate compression ratio
    const compressionRatio = totalSamples / length;

    // Process each channel
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);

      // Resample and compress
      for (let i = 0; i < totalSamples; i++) {
        const originalIndex = Math.floor(i / compressionRatio);
        const sample = channelData[originalIndex];
        // Apply compression while maintaining audio integrity
        newChannelData[i] = Math.max(-1, Math.min(1, sample));
      }
    }

    return newBuffer;
  };

  // Helper function to convert AudioBuffer to WAV with exact size
  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const totalSize = 44 + dataSize; // Header + Data

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const val = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + (i * blockAlign) + (channel * bytesPerSample), val, true);
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Helper function to write string to DataView
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const handleDownload = (song, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setDownloadPosition({
      top: rect.top,
      left: rect.left + rect.width / 2
    });
    setSelectedSong(song);
    setShowQualityModal(true);
  };

  // Add toast notification functions
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `download-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const handleQualitySelect = async (quality) => {
    setShowQualityModal(false);
    if (!selectedSong) return;

    try {
      showToast('Preparing download...', 'info');

      // Fetch the original audio file
      const response = await fetch(selectedSong.audioSrc);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Calculate target size in bytes
      const targetSize = parseSizeToBytes(quality.size);
      
      // Compress the audio to match the target size
      const compressedBuffer = await compressAudio(audioBuffer, targetSize);
      
      // Create WAV file
      const wavBlob = audioBufferToWav(compressedBuffer);
      
      // Verify the size
      if (Math.abs(wavBlob.size - targetSize) > 100) { // Allow 100 bytes tolerance
        throw new Error('Compressed file size does not match target size');
      }

      // Create download link
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedSong.title} - ${quality.label}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Download complete!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Download failed. Please try again.', 'error');
    }
  };

  return (
    <div className="search-page1">
      {/* Now Playing section at the top */}
      {currentSong && (
        <div className="now-playing-top">
          <img src={currentSong.image} alt={currentSong.title} className="now-playing-img" />
          <div className="now-playing-info">
            <div className="now-playing-title">{currentSong.title}</div>
            <div className="now-playing-artist" style={{ color: 'green', cursor: 'pointer' }}>{currentSong.artist}</div>
          </div>
          <div className="now-playing-controls">
            <button
              className="now-playing-btn"
              title={isPlaying ? 'Pause' : 'Play'}
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
            </button>
            <button
              className="now-playing-btn"
              title="Like"
              aria-label="Like"
            >
              <FontAwesomeIcon icon={faHeart} />
            </button>
            <button
              className="now-playing-btn"
              title="Add to Playlist"
              aria-label="Add to Playlist"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button
              className="now-playing-btn"
              title="Download"
              aria-label="Download"
              onClick={(e) => handleDownload(currentSong, e)}
            >
              <PiDownloadSimple />
            </button>
          </div>
        </div>
      )}

      <div className="search-bar" ref={suggestionsRef}>
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <div className="search-input-container">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search songs, artists, movies, or genres..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {searchQuery && suggestion && (
            <div className="search-suggestion" onClick={handleSuggestionClick}>
              {suggestion}
            </div>
          )}
          {/* Dropdown suggestion list */}
          {searchQuery && dropdownSuggestions.length > 0 && (
            <div className="dropdown-suggestions">
              {dropdownSuggestions.map((item, idx) => (
                <div
                  key={item.type + item.value}
                  className={`dropdown-suggestion-item${idx === dropdownActiveIndex ? ' active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDropdownClick(item.value);
                  }}
                >
                  {item.type === 'title' ? (
                    <>
                      <span className="dropdown-song-title">{highlightMatch(item.value, searchQuery)}</span>
                      <span className="dropdown-song-artist" style={{ color: 'green', cursor: 'pointer' }}>{item.song.artist}</span>
                    </>
                  ) : (
                    <span>{highlightMatch(item.value, searchQuery)}</span>
                  )}
                  <span className="dropdown-type">{item.type === 'title' ? 'Song' : item.type === 'artist' ? 'Artist' : 'Movie'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {searchQuery && (
          <FontAwesomeIcon
            icon={faTimes}
            className="clear-icon"
            onClick={() => handleSearch('')}
            tabIndex={0}
            role="button"
            aria-label="Clear search"
          />
        )}
      </div>

      {/* Search results heading */}
      {searchQuery && (
        <div className="search-results-heading">
          Search results for <span className="search-query">"{searchQuery}"</span>
        </div>
      )}

      <div className="results-area">
        {isLoading ? (
          <div className="search-loading">
            <div className="spinner"></div>
            <span>Searching...</span>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="search-hint">
            <h2>Discover Music</h2>
            <p>Search for your favorite songs, artists, movies, or genres</p>
          </div>
        ) : (
          <>
            <div className="search-result">
              {searchResults.map((song) => (
                <div
                  key={song.id}
                  className={`song-item ${currentSong?.id === song.id ? 'active' : ''}`}
                >
                  <div className="song-info" onClick={() => handleSongClick(song)}>
                    <img src={song.image} alt={song.title} />
                    <div>
                      <h3>{song.title}</h3>
                      <span className="artist" style={{ color: 'green', cursor: 'pointer' }}>{song.artist}</span>
                    </div>
                  </div>
                  <div className="song-controls">
                    <button
                      className="play-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentSong?.id === song.id) {
                          handlePlayPause();
                        } else {
                          handleSongClick(song);
                        }
                      }}
                      title={currentSong?.id === song.id && isPlaying ? 'Pause' : 'Play'}
                    >
                      <FontAwesomeIcon
                        icon={currentSong?.id === song.id && isPlaying ? faPause : faPlay}
                      />
                    </button>
                    <button
                      className={`action-button ${likedSongs.some(s => s.id === song.id) ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(song.id);
                      }}
                      title={likedSongs.some(s => s.id === song.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                    >
                      <FontAwesomeIcon icon={faHeart} />
                    </button>
                    <button
                      className={`action-button ${playlistSongs.some(s => s.id === song.id) ? 'added' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToPlaylist(song.id);
                      }}
                      title="Add to Playlist"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                    <button
                      className="action-button"
                      title="Download"
                      onClick={(e) => handleDownload(song, e)}
                    >
                      <PiDownloadSimple />
                    </button>
                    <button
                      className="action-button"
                      title="More Options"
                    >
                      <FontAwesomeIcon icon={faEllipsisH} />
                    </button>
                    <span className="duration">{durations[searchResults.findIndex(s => s.id === song.id)] || song.duration || '--:--'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* You May Also Like section */}
            {currentSong && relatedSongs.length > 0 && (
              <div className="related-songs-section">
                <h2 className="related-songs-heading">You May Also Like</h2>
                <div className="search-result">
                  {relatedSongs.map((song) => (
                    <div
                      key={song.id}
                      className={`song-item ${currentSong?.id === song.id ? 'active' : ''}`}
                    >
                      <div className="song-info" onClick={() => handleSongClick(song)}>
                        <img src={song.image} alt={song.title} />
                        <div>
                          <h3>{song.title}</h3>
                          <span className="artist" style={{ color: 'green', cursor: 'pointer' }}>{song.artist}</span>
                        </div>
                      </div>
                      <div className="song-controls">
                        <button
                          className="play-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentSong?.id === song.id) {
                              handlePlayPause();
                            } else {
                              handleSongClick(song);
                            }
                          }}
                          title={currentSong?.id === song.id && isPlaying ? 'Pause' : 'Play'}
                        >
                          <FontAwesomeIcon
                            icon={currentSong?.id === song.id && isPlaying ? faPause : faPlay}
                          />
                        </button>
                        <button
                          className={`action-button ${likedSongs.some(s => s.id === song.id) ? 'liked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(song.id);
                          }}
                          title={likedSongs.some(s => s.id === song.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                        >
                          <FontAwesomeIcon icon={faHeart} />
                        </button>
                        <button
                          className={`action-button ${playlistSongs.some(s => s.id === song.id) ? 'added' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToPlaylist(song.id);
                          }}
                          title="Add to Playlist"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                        <button
                          className="action-button"
                          title="Download"
                          onClick={(e) => handleDownload(song, e)}
                        >
                          <PiDownloadSimple />
                        </button>
                        <button
                          className="action-button"
                          title="More Options"
                        >
                          <FontAwesomeIcon icon={faEllipsisH} />
                        </button>
                        <span className="duration">{durations[relatedSongs.findIndex(s => s.id === song.id)] || song.duration || '--:--'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Download Quality Modal */}
      <DownloadQualityDropdown
        isOpen={showQualityModal}
        onClose={() => setShowQualityModal(false)}
        onQualitySelect={handleQualitySelect}
        song={selectedSong}
        position={downloadPosition}
      />
    </div>
  );
};

export default SearchPage;

