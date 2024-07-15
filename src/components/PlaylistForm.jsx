import React from 'react';
import styles from './PlaylistForm.module.css'; // Import CSS module

const PlaylistForm = ({ playlistUrl, setPlaylistUrl, handleSubmit }) => {
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="playlist_url">Enter Youtube Playlist URL:</label>
      <input
        type="text"
        id="playlist_url"
        className={styles.input} 
        value={playlistUrl}
        onChange={(e) => setPlaylistUrl(e.target.value)}
        required
      />
      <button type="submit" className={styles.button}>Submit</button>
    </form>
  );
};

export default PlaylistForm;
