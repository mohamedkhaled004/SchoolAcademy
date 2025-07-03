import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface SecurePasswordInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showToggle?: boolean;
  error?: boolean;
  isExistingPassword?: boolean; // New prop to indicate if this is an existing password
}

const SecurePasswordInput: React.FC<SecurePasswordInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = "Enter password",
  required = false,
  disabled = false,
  className = "",
  showToggle = true,
  error = false,
  isExistingPassword = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track if the field has a value
  useEffect(() => {
    setHasValue(value.length > 0);
  }, [value]);

  // Aggressively prevent autocomplete on mount and whenever the component updates
  useEffect(() => {
    if (inputRef.current) {
      // Set multiple attributes to prevent autocomplete
      inputRef.current.setAttribute('autocomplete', 'new-password');
      inputRef.current.setAttribute('data-lpignore', 'true');
      inputRef.current.setAttribute('data-form-type', 'other');
      inputRef.current.setAttribute('data-1p-ignore', 'true');
      inputRef.current.setAttribute('data-bwignore', 'true');
      inputRef.current.setAttribute('data-keeweb', 'false');
      inputRef.current.setAttribute('data-keepass', 'false');
      inputRef.current.setAttribute('data-roboform', 'false');
      inputRef.current.setAttribute('data-dashlane', 'false');
      inputRef.current.setAttribute('data-bitwarden', 'false');
      inputRef.current.setAttribute('data-nordpass', 'false');
      inputRef.current.setAttribute('data-1password', 'false');
      inputRef.current.setAttribute('data-lastpass', 'false');
      
      // Set readonly temporarily to prevent autofill
      inputRef.current.setAttribute('readonly', 'true');
      
      // Remove readonly after a short delay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.removeAttribute('readonly');
        }
      }, 100);
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    // Ensure all autocomplete prevention attributes are set on focus
    const target = e.target;
    target.setAttribute('autocomplete', 'new-password');
    target.setAttribute('data-lpignore', 'true');
    target.setAttribute('data-form-type', 'other');
    target.setAttribute('data-1p-ignore', 'true');
    target.setAttribute('data-bwignore', 'true');
    target.setAttribute('data-keeweb', 'false');
    target.setAttribute('data-keepass', 'false');
    target.setAttribute('data-roboform', 'false');
    target.setAttribute('data-dashlane', 'false');
    target.setAttribute('data-bitwarden', 'false');
    target.setAttribute('data-nordpass', 'false');
    target.setAttribute('data-1password', 'false');
    target.setAttribute('data-lastpass', 'false');
    
    // Additional prevention techniques
    target.setAttribute('spellcheck', 'false');
    target.setAttribute('autocorrect', 'off');
    target.setAttribute('autocapitalize', 'off');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
  };

  // Determine what to display
  const getDisplayValue = () => {
    if (showPassword) {
      return value;
    }
    
    // For existing passwords, show masked characters when not focused
    if (isExistingPassword && hasValue && !isFocused) {
      return '•'.repeat(Math.min(value.length, 8));
    }
    
    return value;
  };

  const baseClasses = "appearance-none relative block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400";
  const borderClasses = error 
    ? "border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500" 
    : "border-gray-300 dark:border-gray-600";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  const inputClasses = `${baseClasses} ${borderClasses} ${disabledClasses} ${className}`;

  return (
    <div className="relative">
      {/* Lock icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        value={getDisplayValue()}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={inputClasses}
        autoComplete="new-password"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        data-lpignore="true"
        data-form-type="other"
        data-1p-ignore="true"
        data-bwignore="true"
        data-keeweb="false"
        data-keepass="false"
        data-roboform="false"
        data-dashlane="false"
        data-bitwarden="false"
        data-nordpass="false"
        data-1password="false"
        data-lastpass="false"
      />
      
      {/* Show/Hide toggle */}
      {showToggle && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      )}
      
      {/* Visual indicator for existing password */}
      {isExistingPassword && hasValue && !isFocused && !showPassword && (
        <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none">
          <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {value.length} chars
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurePasswordInput; 