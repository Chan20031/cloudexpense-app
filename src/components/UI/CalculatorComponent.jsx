import React, { useState } from 'react';

export default function CalculatorComponent({ onResult }) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleUse = () => {
    onResult(parseFloat(display));
  };

  const buttons = [
    { label: 'C', type: 'clear', className: 'bg-red-500 hover:bg-red-600 text-white' },
    { label: '÷', type: 'operation', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { label: '×', type: 'operation', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { label: '-', type: 'operation', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    
    { label: '7', type: 'number', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white' },
    { label: '8', type: 'number', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white' },
    { label: '9', type: 'number', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white' },
    { label: '+', type: 'operation', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    
    { label: '4', type: 'number', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white' },
    { label: '5', type: 'number', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white' },
    { label: '6', type: 'number', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white' },
    { label: '=', type: 'equals', className: 'bg-green-500 hover:bg-green-600 text-white row-span-2' },
    
    { label: '1', type: 'number', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white' },
    { label: '2', type: 'number', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white' },
    { label: '3', type: 'number', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white' },
    
    { label: '0', type: 'number', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white col-span-2' },
    { label: '.', type: 'decimal', className: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white' },
  ];

  const handleButtonClick = (button) => {
    switch (button.type) {
      case 'number':
        inputNumber(button.label);
        break;
      case 'decimal':
        inputDecimal();
        break;
      case 'operation':
        performOperation(button.label);
        break;
      case 'equals':
        handleEquals();
        break;
      case 'clear':
        clear();
        break;
      default:
        break;
    }
  };

  return (
    <div className="calculator w-full max-w-xs mx-auto">
      {/* Display */}
      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-4 border border-gray-300 dark:border-gray-600 shadow-inner">
        <div className="text-right text-2xl font-mono text-gray-900 dark:text-white overflow-hidden">
          {display || '0'}
        </div>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {buttons.map((button, index) => (
          <button
            key={index}
            onClick={() => handleButtonClick(button)}
            className={`
              ${button.className}
              ${button.label === '=' ? 'row-span-2' : ''}
              ${button.label === '0' ? 'col-span-2' : ''}
              h-12 rounded-lg font-semibold text-lg transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            `}
          >
            {button.label}
          </button>
        ))}
      </div>

      {/* Use Result Button */}
      <button
        onClick={handleUse}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200 shadow-md"
      >
        Use Result
      </button>
    </div>
  );
}

