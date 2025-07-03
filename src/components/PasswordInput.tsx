import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: 'new-password' | 'current-password' | 'off';
  showToggle?: boolean;
  error?: boolean;
  showMaskedValue?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = 'Enter password',
  required = false,
  disabled = false,
  className = '',
  autoComplete = 'off',
  showToggle = true,
  error = false,
  showMaskedValue = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasValue(value.length > 0);
  }, [value]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    // Universal hardening
    input.setAttribute('autocomplete', 'new-password');
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-1p-ignore', 'true');
    input.setAttribute('data-form-type', 'other');
    input.setAttribute('data-bwignore', 'true');
    input.setAttribute('data-1password', 'false');
    input.setAttribute('data-lastpass', 'false');
    input.setAttribute('data-keepass', 'false');
    input.setAttribute('data-dashlane', 'false');
    input.setAttribute('data-nordpass', 'false');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('inputmode', 'none');

    // Prevent password manager autofill when showing password
    if (showPassword) {
      input.setAttribute('readonly', 'true');
      setTimeout(() => {
        input.removeAttribute('readonly');
      }, 100);
    }
  }, [showPassword]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getDisplayValue = () => {
    if (showPassword) return value;

    if (showMaskedValue && hasValue && !isFocused) {
      return '•'.repeat(Math.min(value.length, 8));
    }

    return value;
  };

  const inputClasses = `
    appearance-none relative block w-full pl-10 pr-12 py-3 border rounded-lg 
    bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
    placeholder-gray-500 dark:placeholder-gray-400 
    focus:outline-none focus:ring-2 transition-colors 
    ${error
      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
    } 
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
    ${className}
  `;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        name={name || 'user_secret'}
        type={showPassword ? 'text' : 'password'}
        value={getDisplayValue()}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={inputClasses}
        autoComplete="new-password"
      />

      {showToggle && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      )}

      {showMaskedValue && hasValue && !isFocused && !showPassword && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            Existing
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
