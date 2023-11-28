import { useEffect, useState } from "react";
import { useIsOnline } from "../../hooks/network";
import QR from "../atoms/QR";

// Styling adheres to underlying component: https://www.npmjs.com/package/react-qr-code
export default function AnnotatedQR(props) {
	const { ping, online, bad_connection } = useIsOnline();
	const [color, set_color] = useState(props.color || "black");

	useEffect(() => {
		if (!online) return set_color("red");
		if (ping != Infinity && bad_connection) return set_color("orange");
		set_color(props.color || "black");
	}, [online, bad_connection]);

	return <QR {...props} fgColor={color} bgColor={props.background} />;
}
