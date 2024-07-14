import React from 'react';
import styles from './PlaylistInfo.module.css'; // Import CSS module

const PlaylistInfo = ({ playlistInfo, handleWatchedChange, calculateProgress, secondsToHMS, formatVideoDuration }) => {
  return (
    <div className={styles.infoContainer}>
      <p>Total videos in playlist: {playlistInfo.totalVideos}</p>
      <p>Total Length: {secondsToHMS(playlistInfo.totalLengthSeconds)}</p>
      <div className={styles.progressBarContainer}>
        <p>Progress: {calculateProgress().toFixed(2)}%</p>
        <div className={styles.progressBar}>
          <div
            style={{ width: `${calculateProgress()}%` }}
            className={styles.progress}
          ></div>
        </div>
      </div>

    </div>
  );
};

export default PlaylistInfo;
