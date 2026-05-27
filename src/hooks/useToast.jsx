import { useState, useCallback, useRef } from "react";

/**
 * Hook simples de toast (mensagem flutuante temporária).
 * Retorna { message, showToast } — renderize {message && <Toast/>} na tela.
 */
export function useToast(duration = 2500) {
  const [message, setMessage] = useState("");
  const timer = useRef(null);

  const showToast = useCallback(
    (text) => {
      setMessage(text);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(""), duration);
    },
    [duration]
  );

  return { message, showToast };
}
