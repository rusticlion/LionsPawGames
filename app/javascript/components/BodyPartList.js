import React from 'react';
import PropTypes from 'prop-types';
import { humanize } from './utility';

const BodyPartList = ({ bodyParts }) => (
  <div className="body-part-list">
    {bodyParts.map((part, index) => (
      <div key={index} className="body-part-tile">
        {humanize(part)}
      </div>
    ))}
  </div>
);

BodyPartList.propTypes = {
  bodyParts: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default BodyPartList;
