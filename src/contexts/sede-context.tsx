'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { isSede, type Sede } from '@/lib/sedes';

interface SedeContextType {
  sede: Sede | null;
  setSede: (sede: Sede) => void;
  loading: boolean;
}

const SedeContext = createContext<SedeContextType>({
  sede: null,
  setSede: () => {},
  loading: true,
});

export function SedeProvider ({ children }: { children: ReactNode }) {
  const [sede, setSedeState] = useState<Sede | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sedeFromUrl = params.get('sede');

    if (isSede(sedeFromUrl)) {
      setSedeState(sedeFromUrl);
      localStorage.setItem('cmdb-sede', sedeFromUrl);
    } else {
      const saved = localStorage.getItem('cmdb-sede');
      if (isSede(saved)) {
        setSedeState(saved);
      }
    }
    setLoading(false);
  }, []);

  const setSede = useCallback((newSede: Sede) => {
    setSedeState(newSede);
    localStorage.setItem('cmdb-sede', newSede);
  }, []);

  return (
    <SedeContext.Provider value={{ sede, setSede, loading }}>
      {children}
    </SedeContext.Provider>
  );
}

export function useSede () {
  return useContext(SedeContext);
}
