import React from "react";
import { ThemeProvider } from "styled-components";

const theme = {
	colors: {
		title: "#7C72E2",
		subtitle: "#F59DB6",
		primary: "#8076fa",
		text: "#3A3A3A",
		accent: "rgb( 248, 117, 136 )",
		hint: "rgba( 0, 0, 0, .4 )",
		backdrop: "rgba( 0, 0, 0, .05 )",
	},
};

export default (props) => <ThemeProvider {...props} theme={theme} />;
