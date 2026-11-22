import { useRef, useState } from 'react';

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const running = useRef(false);

  async function run(action, onSuccess) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await action();
      onSuccess?.(result);
      return result;
    } catch (error) {
      setMessage(error.message || 'Permintaan belum dapat diproses.');
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return { busy, message, setMessage, run };
}
