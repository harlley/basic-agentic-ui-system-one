import { useRef, useState } from "react";
import { decide } from "@/lib/systemOne";
import { useChatStore } from "@/store/useChatStore";
import { useSquareStore } from "@/store/useSquareStore";

export function useChat() {
  const { messages, addMessage } = useChatStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const busy = useRef(false);

  async function sendMessage(text: string) {
    if (busy.current || !text.trim()) return;
    busy.current = true;
    setIsProcessing(true);
    addMessage({ id: Date.now(), text, sender: "user" });
    let reply: string;
    try {
      const { action, color } = await decide(
        text,
        useSquareStore.getState().squareColor,
      );
      if (action === "get_color") {
        reply = `The square is ${useSquareStore.getState().squareColor}.`;
      } else if (action === "set_color" && color) {
        useSquareStore.getState().setSquareColor(color);
        reply = `Changed the square to ${color}.`;
      } else {
        reply =
          "Please name a specific color to set, or ask what color the square is.";
      }
    } catch (error) {
      reply =
        error instanceof Error && error.name === "TimeoutError"
          ? "The AI endpoint took too long. Please try again."
          : "Could not reach the AI endpoint or read its response. Please try again.";
    } finally {
      busy.current = false;
      setIsProcessing(false);
    }
    addMessage({ id: Date.now() + 1, text: reply, sender: "bot" });
  }

  return { messages, sendMessage, isProcessing };
}
