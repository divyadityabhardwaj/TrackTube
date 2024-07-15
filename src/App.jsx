import React, { useState } from 'react';
import axios from 'axios';
import PlaylistForm from './components/PlaylistForm';
import PlaylistInfo from './components/PlaylistInfo';
import VideoList from './components/VideoList';
import styles from './App.module.css';
import Spline from '@splinetool/react-spline';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const App = () => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [watchedVideos, setWatchedVideos] = useState(new Set());
  const [showNotes, setShowNotes] = useState(false);


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

  const parseDurationInSeconds = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    let hours = parseInt(match[1]) || 0;
    let minutes = parseInt(match[2]) || 0;
    let seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  };

  const secondsToHMS = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    seconds = seconds % 60;
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatVideoDuration = (title, duration) => {
    const totalSeconds = parseDurationInSeconds(duration);
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
          return total + parseDurationInSeconds(video.contentDetails.duration);
        }, 0);

        setPlaylistInfo({
          totalVideos: videoDetails.length,
          totalLengthSeconds,
          videos: videoDetails.map(video => ({
            title: video.snippet.title,
            duration: video.contentDetails.duration,
          })),
        });
        setWatchedVideos(new Set()); // Reset watched videos
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
    if (!playlistInfo || watchedVideos.size === 0) return 0;

    // Calculate total duration of all videos in seconds
    const totalPlaylistSeconds = playlistInfo.videos.reduce((total, video) => {
      return total + parseDurationInSeconds(video.duration);
    }, 0);

    // Calculate duration of watched videos in seconds
    const watchedSeconds = Array.from(watchedVideos).reduce((totalSeconds, title) => {
      const video = playlistInfo.videos.find(v => v.title === title);
      if (video) {
        return totalSeconds + parseDurationInSeconds(video.duration);
      }
      return totalSeconds;
    }, 0);

    // Calculate progress percentage
    const progress = (watchedSeconds / totalPlaylistSeconds) * 100;

    return progress;
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

  const toggleNotes = () => {
    setShowNotes(!showNotes);
  };
  return (
    <div className={styles.parent}>
      <Spline className={styles.background} scene="https://prod.spline.design/bv-dVEpNeSyp134a/scene.splinecode" />
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
              <div className={styles.progressBarWrapper}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
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

      <div className={`${styles.notesPanel} ${showNotes ? styles.show : ''}`}>
        <h2>Notes</h2>
        <textarea placeholder="Take your notes here..."></textarea>
      </div>

      <div className={styles.toggleButton} onClick={toggleNotes}>
        <svg fill="white" height="40px" width="40px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <g> <path d="M179.184,170.667h170.667c4.719,0,8.533-3.823,8.533-8.533c0-4.71-3.814-8.533-8.533-8.533H179.184 c-4.71,0-8.533,3.823-8.533,8.533C170.651,166.844,174.474,170.667,179.184,170.667z"></path> 
        <path d="M484.754,351.497l-17.067-17.067c-13.124-13.116-33.092-13.09-46.199,0L309.684,446.234 c-1.604,1.596-2.5,3.772-2.5,6.033v51.2c0,4.71,3.814,8.533,8.533,8.533h51.2c2.27,0,4.437-0.896,6.033-2.5l111.804-111.804 C498.348,384.102,498.348,365.099,484.754,351.497z M410.454,369.596l13.534,13.534l-74.138,74.138l-13.534-13.534 L410.454,369.596z M324.251,494.933v-39.134l39.134,39.134H324.251z M375.451,482.867l-13.534-13.534l74.138-74.138 l13.525,13.534L375.451,482.867z M472.688,385.63l-11.034,11.034l-39.134-39.134l11.034-11.034c6.758-6.75,15.292-6.767,22.067,0 l17.067,17.067C479.591,370.475,479.591,378.726,472.688,385.63z"></path> 
        <path d="M315.717,51.2h17.067c4.719,0,8.533-3.823,8.533-8.533c0-4.71-3.814-8.533-8.533-8.533h-17.067 c-4.719,0-8.533,3.823-8.533,8.533C307.184,47.377,310.998,51.2,315.717,51.2z"></path> <path d="M366.917,102.4c14.114,0,25.6-11.486,25.6-25.6c0-11.11-7.159-20.489-17.067-24.03V8.533c0-4.71-3.814-8.533-8.533-8.533 s-8.533,3.823-8.533,8.533V52.77c-9.907,3.541-17.067,12.919-17.067,24.03C341.317,90.914,352.803,102.4,366.917,102.4z M366.917,68.267c4.71,0,8.533,3.831,8.533,8.533c0,4.702-3.823,8.533-8.533,8.533s-8.533-3.831-8.533-8.533 C358.384,72.098,362.207,68.267,366.917,68.267z"></path> <path d="M179.184,221.867h153.6c4.719,0,8.533-3.823,8.533-8.533c0-4.71-3.814-8.533-8.533-8.533h-153.6 c-4.71,0-8.533,3.823-8.533,8.533C170.651,218.044,174.474,221.867,179.184,221.867z"></path> 
        <path d="M401.051,51.2h17.067c12.442,0,25.6,13.158,25.6,25.6v221.158c0,4.71,3.814,8.533,8.533,8.533s8.533-3.823,8.533-8.533 V76.8c0-21.931-20.736-42.667-42.667-42.667h-17.067c-4.719,0-8.533,3.823-8.533,8.533C392.517,47.377,396.332,51.2,401.051,51.2 z"></path> <path d="M281.584,102.4c14.114,0,25.6-11.486,25.6-25.6c0-11.11-7.159-20.489-17.067-24.03V8.533c0-4.71-3.814-8.533-8.533-8.533 c-4.719,0-8.533,3.823-8.533,8.533V52.77c-9.907,3.541-17.067,12.919-17.067,24.03C255.984,90.914,267.47,102.4,281.584,102.4z M281.584,68.267c4.71,0,8.533,3.831,8.533,8.533c0,4.702-3.823,8.533-8.533,8.533s-8.533-3.831-8.533-8.533 C273.051,72.098,276.874,68.267,281.584,68.267z"></path> <path d="M375.451,264.533c0-4.71-3.814-8.533-8.533-8.533H179.184c-4.71,0-8.533,3.823-8.533,8.533 c0,4.71,3.823,8.533,8.533,8.533h187.733C371.636,273.067,375.451,269.244,375.451,264.533z"></path> <path d="M179.184,307.2c-4.71,0-8.533,3.823-8.533,8.533s3.823,8.533,8.533,8.533h170.667c4.719,0,8.533-3.823,8.533-8.533 s-3.814-8.533-8.533-8.533H179.184z"></path> 
        <path d="M281.584,443.733c4.719,0,8.533-3.823,8.533-8.533s-3.814-8.533-8.533-8.533H34.117V76.8c0-12.442,13.158-25.6,25.6-25.6 h17.067c4.71,0,8.533-3.823,8.533-8.533c0-4.71-3.823-8.533-8.533-8.533H59.717c-21.931,0-42.667,20.736-42.667,42.667v392.533 c0,21.931,20.736,42.667,42.667,42.667h221.867c4.719,0,8.533-3.823,8.533-8.533s-3.814-8.533-8.533-8.533H59.717 c-9.574,0-19.507-7.808-23.612-17.067h245.478c4.719,0,8.533-3.823,8.533-8.533s-3.814-8.533-8.533-8.533H34.117v-17.067H281.584 z"></path> <path d="M127.984,204.8h-17.067c-4.71,0-8.533,3.823-8.533,8.533c0,4.71,3.823,8.533,8.533,8.533h17.067 c4.71,0,8.533-3.823,8.533-8.533C136.517,208.623,132.694,204.8,127.984,204.8z"></path> <path d="M127.984,358.4h-17.067c-4.71,0-8.533,3.823-8.533,8.533s3.823,8.533,8.533,8.533h17.067c4.71,0,8.533-3.823,8.533-8.533 S132.694,358.4,127.984,358.4z"></path> <path d="M230.384,51.2h17.067c4.719,0,8.533-3.823,8.533-8.533c0-4.71-3.814-8.533-8.533-8.533h-17.067 c-4.71,0-8.533,3.823-8.533,8.533C221.851,47.377,225.674,51.2,230.384,51.2z"></path> <path d="M298.651,358.4H179.184c-4.71,0-8.533,3.823-8.533,8.533s3.823,8.533,8.533,8.533h119.467 c4.719,0,8.533-3.823,8.533-8.533S303.37,358.4,298.651,358.4z"></path> 
        <path d="M127.984,153.6h-17.067c-4.71,0-8.533,3.823-8.533,8.533c0,4.71,3.823,8.533,8.533,8.533h17.067 c4.71,0,8.533-3.823,8.533-8.533C136.517,157.423,132.694,153.6,127.984,153.6z"></path> <path d="M127.984,256h-17.067c-4.71,0-8.533,3.823-8.533,8.533c0,4.71,3.823,8.533,8.533,8.533h17.067 c4.71,0,8.533-3.823,8.533-8.533C136.517,259.823,132.694,256,127.984,256z"></path> <path d="M145.051,51.2h17.067c4.71,0,8.533-3.823,8.533-8.533c0-4.71-3.823-8.533-8.533-8.533h-17.067 c-4.71,0-8.533,3.823-8.533,8.533C136.517,47.377,140.34,51.2,145.051,51.2z"></path> <path d="M127.984,307.2h-17.067c-4.71,0-8.533,3.823-8.533,8.533s3.823,8.533,8.533,8.533h17.067c4.71,0,8.533-3.823,8.533-8.533 S132.694,307.2,127.984,307.2z"></path> <path d="M196.251,102.4c14.114,0,25.6-11.486,25.6-25.6c0-11.11-7.151-20.489-17.067-24.03V8.533c0-4.71-3.823-8.533-8.533-8.533 s-8.533,3.823-8.533,8.533V52.77c-9.916,3.541-17.067,12.919-17.067,24.03C170.651,90.914,182.137,102.4,196.251,102.4z M196.251,68.267c4.702,0,8.533,3.831,8.533,8.533c0,4.702-3.831,8.533-8.533,8.533c-4.702,0-8.533-3.831-8.533-8.533 C187.717,72.098,191.549,68.267,196.251,68.267z"></path> <path d="M110.917,102.4c14.114,0,25.6-11.486,25.6-25.6c0-11.11-7.151-20.489-17.067-24.03V8.533c0-4.71-3.823-8.533-8.533-8.533 c-4.71,0-8.533,3.823-8.533,8.533V52.77C92.468,56.311,85.317,65.69,85.317,76.8C85.317,90.914,96.803,102.4,110.917,102.4z M110.917,68.267c4.702,0,8.533,3.831,8.533,8.533c0,4.702-3.831,8.533-8.533,8.533c-4.702,0-8.533-3.831-8.533-8.533 C102.384,72.098,106.215,68.267,110.917,68.267z"></path> </g> </g> </g> </g></svg>
      </div>
    </div>
  );
};

export default App;
