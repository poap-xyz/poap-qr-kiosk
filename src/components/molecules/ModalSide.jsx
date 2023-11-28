import { useEffect, useState } from "react";
import ReactModal from "react-modal";
import styled from "styled-components";

import Section from "../atoms/Section";

import { ReactComponent as CloseIcon } from "../../assets/icons/Icon_close.svg";

export const CloseModal = styled(CloseIcon)`
	position: absolute;
	right: var(--spacing-3);
	top: var(--spacing-3);
	width: 32px;
	height: 32px;
	cursor: pointer;
	color: var(--primary-400);
	background-color: var(--primary-100);
	border-radius: 50%;
	padding: 5px;
`;

export const StyledModal = styled(ReactModal)`
	height: 100%;
	width: 100%;
	border: none;
	opacity: 1;
	background-color: ${({ light }) =>
		light ? "rgba(var(--white-rgb), 0.5)" : "rgba(var(--primary-700-rgb),0.7)"};
	display: flex;
	align-items: center;
	justify-content: flex-end;
	overflow: scroll;
`;

const Modal = styled(Section)`
	padding: 5rem 2rem 1rem 2rem;
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	max-width: 450px;
	background: white;
	box-shadow: 0px 0 5px 2px rgba(0, 0, 0, 0.1);
	border-left: 1px solid var(--primary-700);
`;

export default ({ children, open = true, showClose = false, setIsOpen, ...props }) => {
	// function to close modal
	const closeModal = () => setIsOpen(false);

	// useEffect for if the state of open is changed
	useEffect(() => setIsOpen(open), [open]);

	return (
		<StyledModal
			ariaHideApp={false}
			style={{ overlay: { background: "none" } }}
			isOpen={open}
			{...props}
		>
			<Modal width="500px" direction="column" align="center" justify="center">
				{/* Close button for modal if showClose = true */}
				{showClose && <CloseModal onClick={closeModal} />}

				{children}
			</Modal>
		</StyledModal>
	);
};
