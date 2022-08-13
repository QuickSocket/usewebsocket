import { useEffect, useMemo, useState } from "react";

export enum WebSocketCallbackType {
	Connected,
	Disconnected,
	Error,
	Message
}

export type WebSocketCallback = (type: WebSocketCallbackType, message?: unknown) => void;
export type SendMessageFunc = (data: string | ArrayBuffer | Blob | ArrayBufferView) => void;
export type DisconnectFunc = () => void;

export interface UseWebSocketResult {
	sendMessage: SendMessageFunc;
	disconnect: DisconnectFunc;
}

export const useWebSocket = (callback: WebSocketCallback, url?: string): UseWebSocketResult => {
	const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

	useEffect(() => {
		if (!url) {
			return;
		}

		const newWebSocket = new WebSocket(url);
		setWebSocket(newWebSocket);
		console.log("URL Changed", "Created new WebSocket and stored in state");

		return () => {
			newWebSocket.close();
			setWebSocket(null);
			console.log("URL Changed", "Closed existing WebSocket and removed state");
		}
	}, [url]);

	useEffect(() => {
		const currentWebSocket = webSocket;
		if (!currentWebSocket || !callback) {
			return;
		}

		console.log("WebSocket/Callback Changed", "Created and assigned callbacks");

		const openCallback = () => callback(WebSocketCallbackType.Connected);
		const errorCallback = () => callback(WebSocketCallbackType.Error);
		const messageCallback = (e: MessageEvent) => callback(WebSocketCallbackType.Message, e.data);

		const closeCallback = () => {
			callback(WebSocketCallbackType.Disconnected);
			setWebSocket(null);
			console.log("WebSocket Closed", "Connection was lost, removed WebSocket from state");
		};

		currentWebSocket.addEventListener("open", openCallback);
		currentWebSocket.addEventListener("close", closeCallback);
		currentWebSocket.addEventListener("error", errorCallback);
		currentWebSocket.addEventListener("message", messageCallback);

		return () => {
			currentWebSocket.removeEventListener("open", openCallback);
			currentWebSocket.removeEventListener("close", closeCallback);
			currentWebSocket.removeEventListener("error", errorCallback);
			currentWebSocket.removeEventListener("message", messageCallback);
			console.log("WebSocket/Callback Changed", "Removed old callbacks");
		};
	}, [webSocket, callback]);

	const sendMessageFunc = useMemo<SendMessageFunc>(() => {
		if (webSocket) {
			console.log("SendMessage", "Is useable");
			return data => webSocket.send(data);
		}

		console.log("SendMessage", "Is unuseable");
		return () => { };
	}, [webSocket]);

	const disconnectFunc = useMemo<DisconnectFunc>(() => {
		if (webSocket) {
			console.log("Disconnect", "Is useable");
			return () => webSocket.close();
		}

		console.log("Disconnect", "Is unuseable");
		return () => { };
	}, [webSocket]);

	return {
		sendMessage: sendMessageFunc,
		disconnect: disconnectFunc
	};
};
