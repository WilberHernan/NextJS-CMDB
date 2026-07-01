import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { CustomSelect } from '@/components/CustomSelect';

const options = ['Opcion A', 'Opcion B', 'Opcion C'];
const defaultProps = {
  options,
  onChange: vi.fn(),
  placeholder: 'Elegir...',
  value: undefined as string | undefined,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Helper: open the select and wait for the portal to render. */
async function openSelect (props = defaultProps) {
  const utils = render(<CustomSelect {...props} />);
  const trigger = screen.getByRole('combobox');

  await act(async () => {
    fireEvent.click(trigger);
  });

  const listbox = await screen.findByRole('listbox');
  const optionButtons = screen.getAllByRole('option');

  return { ...utils, trigger, listbox, optionButtons };
}

describe('CustomSelect', () => {
  // ---- Rendering ----
  it('renders with placeholder when no value', () => {
    render(<CustomSelect {...defaultProps} />);
    expect(screen.getByText('Elegir...')).toBeInTheDocument();
  });

  it('renders the selected value label', () => {
    render(<CustomSelect {...defaultProps} value='Opcion B' />);
    expect(screen.getByText('Opcion B')).toBeInTheDocument();
  });

  it('has aria-haspopup=listbox and aria-expanded=false when closed', () => {
    render(<CustomSelect {...defaultProps} />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  // ---- Open / Close ----
  it('opens on click and sets aria-expanded=true', async () => {
    const { trigger } = await openSelect();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes on outside click', async () => {
    await openSelect();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(document.body);
    });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on Escape when open', async () => {
    const { trigger } = await openSelect();

    await act(async () => {
      fireEvent.keyDown(trigger, { key: 'Escape' });
    });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // ---- Keyboard: Trigger ----
  it('opens and focuses first option on ArrowDown', async () => {
    const { trigger } = await openSelect();
    // Trigger already open from openSelect, but let's test from closed
    await act(async () => {
      fireEvent.click(trigger); // close
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    });

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveFocus();
  });

  it('opens and focuses last option on ArrowUp', async () => {
    render(<CustomSelect {...defaultProps} />);
    const trigger = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    });

    const options = screen.getAllByRole('option');
    expect(options[options.length - 1]).toHaveFocus();
  });

  it('toggles on Space', async () => {
    render(<CustomSelect {...defaultProps} />);
    const trigger = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.keyDown(trigger, { key: ' ' });
    });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(trigger, { key: ' ' });
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // ---- Keyboard: List navigation ----
  it('ArrowDown moves focus to next option (wraps)', async () => {
    const { listbox, optionButtons } = await openSelect();

    // Focus first option
    await act(async () => {
      optionButtons[0].focus();
    });

    // Arrow down → second
    await act(async () => {
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    });
    expect(optionButtons[1]).toHaveFocus();

    // Arrow down → third
    await act(async () => {
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    });
    expect(optionButtons[2]).toHaveFocus();

    // Arrow down → wraps to first
    await act(async () => {
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    });
    expect(optionButtons[0]).toHaveFocus();
  });

  it('ArrowUp moves focus to previous option (wraps)', async () => {
    const { listbox, optionButtons } = await openSelect();

    await act(async () => {
      optionButtons[0].focus();
    });

    // Arrow up from first → wraps to last
    await act(async () => {
      fireEvent.keyDown(listbox, { key: 'ArrowUp' });
    });
    expect(optionButtons[2]).toHaveFocus();

    // Arrow up → second
    await act(async () => {
      fireEvent.keyDown(listbox, { key: 'ArrowUp' });
    });
    expect(optionButtons[1]).toHaveFocus();
  });

  it('Home focuses first option', async () => {
    const { listbox, optionButtons } = await openSelect();

    await act(async () => {
      optionButtons[2].focus();
    });

    await act(async () => {
      fireEvent.keyDown(listbox, { key: 'Home' });
    });
    expect(optionButtons[0]).toHaveFocus();
  });

  it('End focuses last option', async () => {
    const { listbox, optionButtons } = await openSelect();

    await act(async () => {
      optionButtons[0].focus();
    });

    await act(async () => {
      fireEvent.keyDown(listbox, { key: 'End' });
    });
    expect(optionButtons[2]).toHaveFocus();
  });

  it('Enter selects the focused option and calls onChange', async () => {
    const onChange = vi.fn();
    const { listbox, optionButtons } = await openSelect({ ...defaultProps, onChange });

    await act(async () => {
      optionButtons[1].focus();
    });

    await act(async () => {
      fireEvent.keyDown(listbox, { key: 'Enter' });
    });

    expect(onChange).toHaveBeenCalledWith('Opcion B');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('Space selects the focused option and calls onChange', async () => {
    const onChange = vi.fn();
    const { listbox, optionButtons } = await openSelect({ ...defaultProps, onChange });

    await act(async () => {
      optionButtons[2].focus();
    });

    await act(async () => {
      fireEvent.keyDown(listbox, { key: ' ' });
    });

    expect(onChange).toHaveBeenCalledWith('Opcion C');
  });

  it('Escape from list closes and returns focus to trigger', async () => {
    const { trigger, listbox } = await openSelect();

    await act(async () => {
      fireEvent.keyDown(listbox, { key: 'Escape' });
    });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  // ---- Click selection ----
  it('clicking an option calls onChange and closes', async () => {
    const onChange = vi.fn();
    const { optionButtons } = await openSelect({ ...defaultProps, onChange });

    await act(async () => {
      fireEvent.click(optionButtons[0]);
    });

    expect(onChange).toHaveBeenCalledWith('Opcion A');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // ---- ARIA on options ----
  it('marks the selected option with aria-selected', async () => {
    const { optionButtons } = await openSelect({ ...defaultProps, value: 'Opcion B' });
    expect(optionButtons[1]).toHaveAttribute('aria-selected', 'true');
    expect(optionButtons[0]).toHaveAttribute('aria-selected', 'false');
  });

  // ---- Object options ----
  it('supports { value, label } option objects', async () => {
    const objOptions = [
      { value: '1', label: 'Uno' },
      { value: '2', label: 'Dos' },
    ];
    render(<CustomSelect options={objOptions} onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.click(trigger);
    });

    expect(screen.getByText('Uno')).toBeInTheDocument();
    expect(screen.getByText('Dos')).toBeInTheDocument();
  });
});
