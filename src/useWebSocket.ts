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

		return () => {
			newWebSocket.close();
			setWebSocket(null);
		}
	}, [url]);

	useEffect(() => {
		const currentWebSocket = webSocket;
		if (!currentWebSocket || !callback) {
			return;
		}

		const openCallback = () => callback(WebSocketCallbackType.Connected);
		const errorCallback = () => callback(WebSocketCallbackType.Error);
		const messageCallback = (e: MessageEvent) => callback(WebSocketCallbackType.Message, e.data);

		const closeCallback = () => {
			callback(WebSocketCallbackType.Disconnected);
			setWebSocket(null);
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
		};
	}, [webSocket, callback]);

	const sendMessageFunc = useMemo<SendMessageFunc>(() => {
		if (webSocket) {
			return data => webSocket.send(data);
		}

		return () => { };
	}, [webSocket]);

	const disconnectFunc = useMemo<DisconnectFunc>(() => {
		if (webSocket) {
			return () => webSocket.close();
		}

		return () => { };
	}, [webSocket]);

	return {
		sendMessage: sendMessageFunc,
		disconnect: disconnectFunc
	};
};
