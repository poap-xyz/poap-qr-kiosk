import React from "react";

const WebpImager = ({ imageUrl, ...props }) => {
	return (
		<picture>
			<source srcSet={`${imageUrl}.webp`} type="image/webp" />
			<img src={`${imageUrl}.jpg`} {...props} />
		</picture>
	);
};

export default WebpImager;
