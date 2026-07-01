import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EquipmentForm } from '@/components/EquipmentForm';
import { COLUMNAS, SECCIONES } from '@/types/equipment';

const defaultProps = {
  visible: true,
  esModoNuevo: false,
  hojaBadgeText: 'EquiposSena · Fila 15',
  hojaBadgeVariant: 'default' as const,
  valores: Array(COLUMNAS.length).fill(''),
  validaciones: {},
  validacionesIndices: [],
  onValorChange: vi.fn(),
  onGuardar: vi.fn(),
  saving: false,
};

describe('EquipmentForm', () => {
  it('returns null when visible=false', () => {
    const { container } = render(<EquipmentForm {...defaultProps} visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the title and badge when visible', () => {
    render(<EquipmentForm {...defaultProps} />);
    expect(screen.getByText('Ficha del Equipo')).toBeInTheDocument();
    expect(screen.getByText('EquiposSena · Fila 15')).toBeInTheDocument();
  });

  it('renders all 53 column labels', () => {
    render(<EquipmentForm {...defaultProps} />);
    COLUMNAS.forEach((nombre) => {
      expect(screen.getByText(nombre)).toBeInTheDocument();
    });
  });

  it('renders all section headers', () => {
    render(<EquipmentForm {...defaultProps} />);
    Object.values(SECCIONES).forEach((section) => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  it('renders the save button with correct text in edit mode', () => {
    render(<EquipmentForm {...defaultProps} />);
    expect(screen.getByText('Guardar Actualización')).toBeInTheDocument();
  });

  it('renders the register button in new mode', () => {
    render(<EquipmentForm {...defaultProps} esModoNuevo />);
    expect(screen.getByText('Registrar Nuevo Equipo')).toBeInTheDocument();
  });

  it('shows Guardando… and disables button when saving', () => {
    render(<EquipmentForm {...defaultProps} saving />);
    const btn = screen.getByText('Guardando…').closest('button');
    expect(btn).toBeDisabled();
  });

  it('calls onGuardar when save button is clicked', () => {
    const onGuardar = vi.fn();
    render(<EquipmentForm {...defaultProps} onGuardar={onGuardar} />);
    fireEvent.click(screen.getByText('Guardar Actualización'));
    expect(onGuardar).toHaveBeenCalledTimes(1);
  });

  it('renders a text input for HOSTNAME (index 0)', () => {
    render(<EquipmentForm {...defaultProps} />);
    const hostnameInput = document.getElementById('field-0') as HTMLInputElement;
    expect(hostnameInput).toBeTruthy();
    expect(hostnameInput.tagName).toBe('INPUT');
    expect(hostnameInput.type).toBe('text');
  });

  it('renders a textarea for Observaciones (index 50)', () => {
    render(<EquipmentForm {...defaultProps} />);
    const obsField = document.getElementById('field-50') as HTMLTextAreaElement;
    expect(obsField).toBeTruthy();
    expect(obsField.tagName).toBe('TEXTAREA');
  });

  it('makes PLACA (field-6) readonly in edit mode', () => {
    render(<EquipmentForm {...defaultProps} esModoNuevo={false} />);
    const placaInput = document.getElementById('field-6') as HTMLInputElement;
    expect(placaInput).toHaveAttribute('readonly');
  });

  it('makes PLACA (field-6) readonly in new mode too', () => {
    render(<EquipmentForm {...defaultProps} esModoNuevo />);
    const placaInput = document.getElementById('field-6') as HTMLInputElement;
    expect(placaInput).toHaveAttribute('readonly');
  });

  it('renders a date input for FECHA ULTIMO MANTENIMIENTO (index 47)', () => {
    render(<EquipmentForm {...defaultProps} />);
    const dateField = document.getElementById('field-47') as HTMLInputElement;
    expect(dateField).toBeTruthy();
    expect(dateField.type).toBe('date');
  });

  it('renders a date input for FECHA IMPACTO MAQUINA (index 48)', () => {
    render(<EquipmentForm {...defaultProps} />);
    const dateField = document.getElementById('field-48') as HTMLInputElement;
    expect(dateField).toBeTruthy();
    expect(dateField.type).toBe('date');
  });

  it('renders CustomSelect (combobox) for fields with validaciones', () => {
    const validaciones = { 3: ['HP', 'DELL', 'LENOVO'] };
    const validacionesIndices = [3];
    render(
      <EquipmentForm
        {...defaultProps}
        validaciones={validaciones}
        validacionesIndices={validacionesIndices}
      />
    );
    // MARCA (index 3) should render as a combobox button with id field-3
    const combobox = document.getElementById('field-3');
    expect(combobox).toBeTruthy();
    expect(combobox?.tagName).toBe('BUTTON');
    expect(combobox?.getAttribute('role')).toBe('combobox');
  });

  it('renders all column numbers as labels (1-based)', () => {
    render(<EquipmentForm {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(String(COLUMNAS.length))).toBeInTheDocument();
  });
});
