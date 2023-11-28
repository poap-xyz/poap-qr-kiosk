import { mixin } from "@poap/poap-components";
import styled from "styled-components";

export const Grid = styled.div`
	width: 100%;
	margin: 0 auto;
	max-width: ${({ width }) => width || ""};
	padding: ${({ padding }) => padding || ""};
	margin: ${({ margin }) => margin || ""};
`;

export const Row = styled.div`
	margin: ${({ margin = "0" }) => margin};
	padding: ${({ padding = "0" }) => padding};
	max-width: 100%;
	display: flex;
	flex-direction: ${({ reverse }) => (reverse ? "column-reverse" : "column")};
	flex-wrap: wrap;
	gap: ${({ gap = 0 }) => gap};
	justify-content: ${({ justify }) => justify || ""};
	align-items: ${({ align }) => align || ""};
	width: ${({ width }) => width};

	${mixin.sm_up`
		flex-direction: row;
        gap: ${(props) => props.gap};
        margin: ${({ margin = "0" }) => margin};
	`}
`;

export const Col = styled.div`
	flex: ${({ size }) => size || "1"};
	display: flex;
	flex-direction: ${({ direction }) => direction || "column"};
	align-items: ${({ align }) => align || ""};
	justify-content: ${({ justify }) => justify || ""};
	padding: ${({ padding = "0" }) => padding};
	width: ${({ width }) => width};
	max-width: 100%;
`;
