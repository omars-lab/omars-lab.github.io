import React, {useState} from 'react';
import styles from '../css/FancyButton.module.css';

// import gtag from '@docusaurus/plugin-google-gtag';
// Cant at this point emit custom events ...
// https://stackoverflow.com/questions/60165146/docusaurus-track-actions-with-google-analytics

export const Vote = ({children, color}) => (
  <button
    className={styles.FancyButton}
    // style={{
    //   backgroundColor: color,
    //   borderRadius: '25px',
    //   borderColor: '#ffa',
    //   color: '#fff',
    //   padding: '10px',
    //   cursor: 'pointer',
    //   width: "50%"
    // }}
    onClick={() => {
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/events
      // ga('send', 'event', 'vote', 'voted-for-blog', 'building-vcode-plugin', 'building-vcode-plugin');
      // alert("Voting");
      // https://developers.google.com/analytics/devguides/collection/gtagjs/events
      // gtag('event', 'voted-for-blogpost', {
      //   'event_category': 'feature-request',
      //   'event_label': 'vote',
      //   'value': window.location.pathname.split("/").pop()
      // });
      console.log("Thanks for voting!")
    }}>
    {children}
  </button>
);

