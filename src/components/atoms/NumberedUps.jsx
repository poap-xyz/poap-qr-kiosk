import { mixin } from "@poap/poap-components";
import styled, { css } from "styled-components";

import { ReactComponent as Star } from "./../../assets/decorations/star-w-alt.svg";

const ComponentContainer = styled.div`
	display: flex;
	flex-direction: row;
	margin-bottom: var(--spacing-6);
	${mixin.md_down`
        justify-content: center;
	`}
`;

const IconContainer = styled.div`
	width: 48px;
	height: 48px;
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: var(--spacing-4);
	--fs: 32px;
	--width: 48px;
	--height: 48px;
	--border-radius: 12px;
	--text-offset: 4px;
	--color-stroke: var(--primary-700);
	/* ${mixin.md_up`
        --fs: 32px;
        --width: 48px;
        --height: 48px;
        --border-radius: 12px;
	`} */
`;

const TextContainer = styled.div`
	display: flex;
	flex-direction: column;
	margin-left: var(--spacing-4);
`;

const layerStyles = css`
	position: absolute;
	width: var(--width);
	height: var(--height);
	border: 1px solid var(--color-stroke);
	border-radius: var(--border-radius);
`;

const Number = styled.p`
	position: relative;
	color: #fff;
	font-family: var(--ff-thick);
	font-size: var(--fs);
	font-weight: 400;
	-webkit-text-stroke-width: 1px;
	-webkit-text-stroke-color: var(--color-stroke);
	margin: 0;
`;

const StyledStar = styled(Star)`
	position: absolute;
	top: -7.5px;
	right: -12.5px;
`;

const LayerOne = styled.span`
	background: var(--primary-200);
	${layerStyles};
`;

const LayerTwo = styled.span`
	background: var(--primary-300);
	transform: translate(calc(var(--text-offset) * -1), calc(var(--text-offset)));
	${layerStyles};
`;

const LayerThree = styled.span`
	background: var(--primary-600);
	transform: translate(calc(var(--text-offset) * -2), calc(var(--text-offset) * 2));
	box-shadow: -6px 8px 0 rgba(var(--primary-400-rgb), 0.25);
	${layerStyles};
`;

const Title = styled.span`
	color: var(--primary-600);
	font-size: var(--fs-lg);
	line-height: var(--lh-lg);
	font-weight: 700;
`;

const Description = styled.p`
	margin-bottom: 0;
	max-width: 290px;
`;

export const NumberedUps = ({ number, title, description }) => {
	return (
		<ComponentContainer>
			<IconContainer>
				<LayerThree />
				<LayerTwo />
				<LayerOne />

				<Number>
					{number}
					<StyledStar />
				</Number>
			</IconContainer>
			<TextContainer>
				<Title>{title}</Title>
				<Description>{description}</Description>
			</TextContainer>
		</ComponentContainer>
	);
};
