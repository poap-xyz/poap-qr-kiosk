import React from "react";
import styled, { css } from "styled-components";

const ButtonInnerWrapper = styled.span`
	display: flex;
	gap: var(--spacing-2);
	align-items: center;
	justify-content: space-between;
	width: 100%;

	span {
		&:first-child,
		&:last-child {
			line-height: 1;
			flex-grow: 1;
			text-align: ${({ align_text = "center" }) => align_text};
		}
	}
	svg {
		width: auto;
		height: ${({ icon_height = "18px" }) => icon_height};
		path {
			fill: white;
		}
	}
	// color
	${({ color }) =>
		color == "white" &&
		css`
			svg {
				path {
					fill: var(--primary-600);
				}
			}
		`}
	${({ disabled }) =>
		disabled &&
		css`
			svg {
				fill: var(--gray-400);
				path {
					fill: var(--gray-400);
				}
			}
		`}
`;

const ButtonWrapper = styled.span`
	display: flex;
	justify-content: center;
	gap: var(--spacing-3);
	position: relative;
	height: 2.75rem;
	padding: var(--spacing-3) var(--spacing-4);
	border: 1px solid var(--primary-600);
	border-radius: 44px;
	transform: translateY(0);
	transition:
		background-color 0.3s ease-out,
		transform 0.3s ease-out,
		border-color 0.3s ease-out;
	color: var(--primary-600);
	background-color: ${({ background }) => background || "var(--primary-400)"};
	// size
	${({ size }) =>
		size == "small" &&
		css`
			height: 2.25rem;
			padding: var(--spacing-2) var(--spacing-3);
		`}
	// color
    ${({ disabled }) =>
		disabled &&
		css`
			color: var(--gray-400);
			background-color: var(--gray-200);
			border-color: var(--gray-300);
		`}
`;

const BaseButton = styled.a`
	position: relative;
	display: inline-block;
	background: none;
	border: 0;
	padding: 0;
	margin: ${({ margin = "0 0 0.8rem" }) => margin};
	font-weight: 500;
	font-size: 1rem;
	line-height: 1.2;
	text-align: center;
	text-decoration: none;
	width: ${({ width }) => width || "initial"};
	min-width: 2.75rem;
	height: 2.75rem;
	outline: 0;
	cursor: pointer;
	user-select: none;
	// size
	${({ size }) =>
		size == "small" &&
		css`
			height: 2.25rem;
		`}

	::before {
		content: "";
		position: absolute;
		top: 8px;
		left: 0;
		width: 100%;
		height: 2.75rem;
		border-radius: 44px;
		background-color: var(--primary-200);
		transition: background-color 0.3s ease-out;
		// size
		${({ size }) =>
			size == "small" &&
			css`
				top: 6px;
				height: 2.25rem;
				border-radius: 2.25rem;
			`}
		// color
        ${({ disabled }) =>
			disabled &&
			css`
				background-color: var(--gray-200);
			`}
	}
	:not(:disabled):active ${ButtonWrapper} {
		transform: translateY(8px);
		// size
		${({ size }) =>
			size == "small" &&
			css`
				transform: translateY(6px);
			`}
		// Disabled
        ${({ disabled }) =>
			disabled &&
			css`
				transform: none;
				color: var(--gray-400);
				background-color: var(--gray-200);
				border-color: var(--gray-300);
			`}
	}
	:not(:disabled):not(:active):focus-visible
		${ButtonWrapper},
		:not(:disabled):not(:active):focus
		${ButtonWrapper} {
		border: 1px solid var(--secondary-6);
		/* padding: var(--spacing-3) calc( var(--spacing-3) - 3px + 1px); */
	}
`;

export const StroopButton = ({
	disabled,
	color,
	background,
	size,
	onClick,
	align_text = "center",
	href,
	children,
	tabIndex = "0",
	...props
}) => {
	function open_tab() {
		if (href) window.open(href, "_blank").focus();
	}

	function handleKeyDown(e) {
		if (e.key === "Enter" && !disabled) {
			if (onClick) {
				onClick();
			} else {
				open_tab();
			}
		}
	}

	return (
		<BaseButton
			disabled={disabled}
			onClick={disabled ? null : onClick || open_tab}
			onKeyDown={handleKeyDown}
			size={size}
			tabIndex={tabIndex}
			{...props}
		>
			<ButtonWrapper disabled={disabled} color={color} background={background} size={size}>
				<ButtonInnerWrapper align_text={align_text} disabled={disabled}>
					{children && <span>{children}</span>}
				</ButtonInnerWrapper>
			</ButtonWrapper>
		</BaseButton>
	);
};
