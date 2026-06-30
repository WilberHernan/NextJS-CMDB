import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordCard } from '@/components/PasswordCard';
import type { Sede } from '@/lib/sedes';

const defaultProps = {
  password: '',
  setPassword: vi.fn(),
  error: '',
  setError: vi.fn(),
  submitting: false,
  showPassword: false,
  setShowPassword: vi.fn(),
  selectedSede: 'CCYS' as Sede,
  setSelectedSede: vi.fn(),
  onSubmit: vi.fn((e) => e.preventDefault()),
  inputRef: { current: null },
};

describe('PasswordCard', () => {
  it('renderiza el formulario con los elementos clave', () => {
    render(<PasswordCard {...defaultProps} />);

    expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByText('Entrar')).toBeInTheDocument();
  });

  it('muestra el nombre de la sede seleccionada', () => {
    render(<PasswordCard {...defaultProps} selectedSede='REGIONAL' />);

    expect(screen.getByText('REGIONAL')).toBeInTheDocument();
  });

  it('permite toggle de visibilidad de contraseña', () => {
    render(<PasswordCard {...defaultProps} />);

    const toggle = screen.getByLabelText('Mostrar contraseña');
    expect(toggle).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(defaultProps.setShowPassword).toHaveBeenCalledWith(true);
  });

  it('muestra error cuando se provee', () => {
    render(<PasswordCard {...defaultProps} error='Contraseña incorrecta' />);

    expect(screen.getByText('Contraseña incorrecta')).toBeInTheDocument();
  });

  it('cambia el texto del botón a "Verificando…" cuando submitting', () => {
    render(<PasswordCard {...defaultProps} submitting />);

    expect(screen.getByText('Verificando…')).toBeInTheDocument();
  });

  it('llama a onSubmit al submitear el formulario', () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    render(<PasswordCard {...defaultProps} onSubmit={handleSubmit} />);

    // El botón type="submit" está dentro de <form>, submitiamos el form
    const form = screen.getByRole('button', { name: 'Entrar' }).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(handleSubmit).toHaveBeenCalledOnce();
  });
});
