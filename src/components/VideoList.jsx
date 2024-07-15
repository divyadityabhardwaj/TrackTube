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
        <div
          key={index}
          className={`${styles.videoItem} ${video.highlighted ? styles.highlighted : ''}`}
        >
          <div>
          <input
            type="checkbox"
            id={video.title}
            name="watched"
            value={video.duration}
            onChange={() => handleWatchedChange(video.title)}
          />
          <svg
            fill="#ffffff"
            width="13px"
            height="13px"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            stroke="#ffffff"
            className={styles.markButton}
            onClick={() => handleToggleHighlight(video.title)}
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <g fill="gray">
                <path d="M8 0a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8zm0 1a7 7 0 0 1 7 7 7 7 0 0 1-7 7 7 7 0 0 1-7-7 7 7 0 0 1 7-7z"></path>
                <path d="M8.708 5.663q0 1.19-.085 2.167-.085.963-.212 1.926h-.822q-.127-.963-.212-1.926-.085-.977-.085-2.167V3h1.416zm.241 6.388q0 .382-.255.666Q8.44 13 8 13q-.44 0-.694-.283-.255-.284-.255-.666 0-.382.255-.666.255-.283.694-.283.44 0 .694.283.255.284.255.666z" style={{lineHeight: '1000%', fontFamily: 'Ubuntu'}} fontWeight="400" letterSpacing="0" wordSpacing="0"></path>
              </g>
            </g>
          </svg>
          </div>
          <label htmlFor={video.title}>{formatVideoDuration(video.title, video.duration)}</label>
        </div>
      ))}
    </div>
  );
};

export default VideoList;
