import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CaretDown, Check } from '@phosphor-icons/react';
import styles from './Select.module.css';

export const SORT_OPTIONS = [
  { value: 'asc', label: 'Nome: A a Z' },
  { value: 'desc', label: 'Nome: Z a A' },
];

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  ariaLabel,
  className = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  const selectedIndex = options.findIndex((option) => String(option.value) === String(value));
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = useCallback(() => setIsOpen(false), []);

  const open = () => {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const choose = (option) => {
    onChange(String(option.value));
    close();
    triggerRef.current?.focus();
  };

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const maxHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openUp = spaceBelow < Math.min(maxHeight, 160) && rect.top > spaceBelow;
    setPosition({
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, Math.min(maxHeight, openUp ? rect.top - 8 : spaceBelow)),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (triggerRef.current?.contains(event.target) || listRef.current?.contains(event.target)) return;
      close();
    };
    const handleScroll = (event) => {
      if (listRef.current?.contains(event.target)) return;
      close();
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen || !position) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, position, activeIndex]);

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        open();
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (options[activeIndex]) choose(options[activeIndex]);
    } else if (event.key === 'Tab') {
      close();
    }
  };

  return (
    <div className={`${styles.root} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedOption ? styles.value : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <CaretDown
          className={`${styles.caret} ${isOpen ? styles.caretOpen : ''}`}
          size={14}
          weight="bold"
          aria-hidden="true"
        />
      </button>

      {isOpen && position && createPortal(
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className={styles.list}
          style={position}
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`${styles.option} ${index === activeIndex ? styles.optionActive : ''} ${isSelected ? styles.optionSelected : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} weight="bold" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>,
        document.body,
      )}
    </div>
  );
}
