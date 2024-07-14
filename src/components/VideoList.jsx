import React from 'react';
import styles from './VideoList.module.css'; // Import CSS module

const VideoList = ({ videos, handleWatchedChange, formatVideoDuration, onToggleHighlight }) => {

  const handleToggleHighlight = (title) => {
    onToggleHighlight(title); // Call onToggleHighlight function passed as prop
  };

  return (
    <div className={styles.videoContainer}>
      <h3>Videos:</h3>
      {videos.map((video, index) => (
        <div key={index} className={styles.videoItem} style={{ backgroundColor: video.highlighted ? 'yellow' : 'inherit' }}>
          <input
            type="checkbox"
            id={video.title}
            name="watched"
            value={video.duration}
            onChange={() => handleWatchedChange(video.title)}
          />
          <label htmlFor={video.title}>{formatVideoDuration(video.title, video.duration)}</label>
          <button onClick={() => handleToggleHighlight(video.title)}>Mark/Highlight</button>
        </div>
      ))}
    </div>
  );
};

export default VideoList;
