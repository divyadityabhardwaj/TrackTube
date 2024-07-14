import React, { useState } from 'react';
import axios from 'axios';
import PlaylistForm from './components/PlaylistForm';
import PlaylistInfo from './components/PlaylistInfo';
import VideoList from './components/VideoList';
import styles from './App.module.css';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const App = () => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [watchedVideos, setWatchedVideos] = useState(new Set());

  const extractPlaylistId = (url) => {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('list');
  };

  const fetchPlaylistItems = async (playlistId) => {
    let videoIds = [];
    let nextPageToken = '';

    do {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/playlistItems`,
          {
            params: {
              part: 'contentDetails',
              maxResults: 50,
              playlistId,
              pageToken: nextPageToken,
              key: API_KEY,
            },
          }
        );

        videoIds = videoIds.concat(response.data.items.map(item => item.contentDetails.videoId));
        nextPageToken = response.data.nextPageToken;
      } catch (error) {
        console.error('Error fetching playlist items:', error);
        throw error;
      }
    } while (nextPageToken);

    return videoIds;
  };

  const fetchVideoDetails = async (videoIds) => {
    const chunkSize = 50;
    const chunks = [];

    for (let i = 0; i < videoIds.length; i += chunkSize) {
      chunks.push(videoIds.slice(i, i + chunkSize));
    }

    const videoDetails = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const response = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos`,
            {
              params: {
                part: 'snippet,contentDetails',
                id: chunk.join(','),
                key: API_KEY,
              },
            }
          );
          return response.data.items;
        } catch (error) {
          console.error('Error fetching video details:', error);
          throw error; // Propagate the error
        }
      })
    );

    return videoDetails.flat();
  };

  const parseDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return (hours * 3600) + (minutes * 60) + seconds;
  };

  const secondsToHMS = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    seconds = seconds % 60;
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatVideoDuration = (title, duration) => {
    const totalSeconds = parseDuration(duration);
    const formattedTime = secondsToHMS(totalSeconds);
    return `${title} (${formattedTime})`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const playlistId = extractPlaylistId(playlistUrl);
    if (playlistId) {
      try {
        const videoIds = await fetchPlaylistItems(playlistId);
        const videoDetails = await fetchVideoDetails(videoIds);

        const totalLengthSeconds = videoDetails.reduce((total, video) => {
          return total + parseDuration(video.contentDetails.duration);
        }, 0);

        setPlaylistInfo({
          totalVideos: videoDetails.length,
          totalLengthSeconds,
          videos: videoDetails.map(video => ({
            title: video.snippet.title,
            duration: video.contentDetails.duration,
          })),
        });
        setWatchedVideos(new Set());
      } catch (error) {
        console.error('Error fetching playlist info:', error);
      }
    }
  };

  const handleWatchedChange = (title) => {
    setWatchedVideos((prevWatched) => {
      const newWatched = new Set(prevWatched);
      if (newWatched.has(title)) {
        newWatched.delete(title);
      } else {
        newWatched.add(title);
      }
      return newWatched;
    });
  };

  const calculateProgress = () => {
    if (!playlistInfo) return 0;
    return (watchedVideos.size / playlistInfo.totalVideos) * 100;
  };

  const handleToggleHighlight = (title) => {
    if (!playlistInfo) return;

    setPlaylistInfo(prevInfo => ({
      ...prevInfo,
      videos: prevInfo.videos.map(video => {
        if (video.title === title) {
          return {
            ...video,
            highlighted: !video.highlighted,
          };
        }
        return video;
      }),
    }));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>TrackTube</h1>
      <div className={styles.formContainer}>
        <PlaylistForm
          playlistUrl={playlistUrl}
          setPlaylistUrl={setPlaylistUrl}
          handleSubmit={handleSubmit}
        />
      </div>
      {playlistInfo && (
        <>
          <div className={styles.infoContainer}>
            <PlaylistInfo
              playlistInfo={playlistInfo}
              handleWatchedChange={handleWatchedChange}
              calculateProgress={calculateProgress}
              secondsToHMS={secondsToHMS}
              formatVideoDuration={formatVideoDuration}
            />
          </div>
          <div className={styles.videoListContainer}>
            <VideoList
              videos={playlistInfo.videos}
              handleWatchedChange={handleWatchedChange}
              formatVideoDuration={formatVideoDuration}
              onToggleHighlight={handleToggleHighlight} 
            />
          </div>
        </>
      )}
    </div>
  );
};

export default App;
