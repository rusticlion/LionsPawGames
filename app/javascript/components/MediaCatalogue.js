import React from 'react';
import NavigationOverlay from './NavigationOverlay';

const MediaCatalogue = props => {
  // Dummy data
  const mediaItems = [
    { title: 'Movie 1', description: 'A great movie.' },
    { title: 'Book 2', description: 'A wonderful read.' },
    // Add more...
  ];

  return (
    <div className="media-catalogue">
      <div className="media-items">
        {mediaItems.map((item, index) => (
          <div key={index} className="media-item">
            <div className="thumbnail"></div>
            <div className="content">
              <div className="title">{item.title}</div>
              <div className="description">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
      <NavigationOverlay />
    </div>
  );
};

export default MediaCatalogue;