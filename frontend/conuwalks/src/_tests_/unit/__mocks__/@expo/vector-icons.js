import React from "react";
import PropTypes from "prop-types";

export const Ionicons = (props) => <>{props.children}</>;
Ionicons.propTypes = {
	children: PropTypes.node
};

export const MaterialIcons = (props) => <>{props.children}</>;
MaterialIcons.propTypes = {
	children: PropTypes.node
};
