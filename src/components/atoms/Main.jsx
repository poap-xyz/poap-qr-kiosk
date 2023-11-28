import styled, { css } from "styled-components";
import { mixin } from "@poap/poap-components";

export default styled.main`
	overflow: hidden;

	min-height: calc(100vh - var(--header-height));
	${(props) =>
		props.showBackground &&
		css`
			${mixin.sm_up`
			background: ${({ background }) =>
				background ||
				'linear-gradient( rgba( 255, 255 ,255 , .75 ), rgba( 255, 255, 255, .75 )), url("/assets/front/Illustration_Cities_Amsterdam.svg")'};
			background-size: contain;
			background-position: bottom;
			background-repeat: no-repeat;
			background-attachment: fixed;
		`}
		`}
	${(props) =>
		props.hideHeader &&
		css`
			min-height: 100vh;
		`}
	${(props) =>
		props.center &&
		css`
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			text-align: center;
		`}
`;
