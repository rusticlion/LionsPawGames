import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MediaItem = ({ id }) => {
  const [mediaItemData, setMediaItemData] = useState({title:"",synopsis:"",recommendation:"",discussion:"",tags:[],directRecommendations:[]});
  const [showDiscussion, setShowDiscussion] = useState(false);

  useEffect(() => {
    axios.get(`/media_items/${id}`)
      .then(response => {
        setMediaItemData(response.data);
      })
      .catch(error => {
        console.error("There was an error fetching data", error);
      });
  }, [id]);
  
  return (
    <div className="media-item">
      <h2 className="title">{mediaItemData.title}</h2>
      <p className="synopsis">{mediaItemData.synopsis}</p>
      {/* Added margin for spacing */}
      <p className="recommendation" style={{ marginTop: '2em' }}>{mediaItemData.recommendation}</p>
      
      {/* Stylish "Show Discussion" Button */}
      <div className="show-discussion" onClick={() => setShowDiscussion(!showDiscussion)}>
        <span className="icon">🔍</span>
        {showDiscussion ? 'Hide Discussion' : 'Show Discussion'}
      </div>

      {showDiscussion && <p className="discussion">{mediaItemData.discussion}</p>}
      
      <div className="tags">
        {mediaItemData.tags.map((tag, index) => (
          <span key={index} className="tag">{tag}</span>
        ))}
      </div>

      {/* Direct Recommendations */}
      <div className="direct-recommendations">
        {mediaItemData.directRecommendations.map((rec, index) => (
          <div key={index} className="recommendation-tile">
            <h3>{rec?.title}</h3>
            <p>{rec?.synopsis}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

MediaItem.propTypes = {
  title: PropTypes.string.isRequired,
  synopsis: PropTypes.string.isRequired,
  recommendation: PropTypes.string.isRequired,
  discussion: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  directRecommendations: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default MediaItem;