// src/pages/tools/AptosAPYCalculator/components/CalculatorForm.jsx
import React from 'react';
import { Form, Checkbox, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Wallet, Percent, SlidersHorizontal } from 'lucide-react'; // SlidersHorizontal is already imported

const { Text } = Typography;

// StyledNumberInputWithAddon (remains the same as your provided version)
const StyledNumberInputWithAddon = ({
  value,
  onChange,
  placeholder,
  addonText,
  name,
  min,
  max,
  step = "any"
}) => {
  const inputTextStyling = "!text-gray-100 placeholder:!text-gray-500 !text-lg !text-right";
  const inputPadding = "!px-4 !py-3";
  const hideSpinnersClass = "hide-number-spinners";
  const parentGroupBaseClasses = "flex items-stretch w-full !bg-gray-900 !border !border-gray-700 !rounded-xl !shadow-sm";
  const parentGroupFocusWithinClasses = "focus-within:!ring-2 focus-within:!ring-purple-500 focus-within:!border-transparent";

  return (
    <div className={`${parentGroupBaseClasses} ${parentGroupFocusWithinClasses}`}>
      <input
        type="number"
        name={name}
        value={value === undefined || value === null ? '' : value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={`flex-grow min-w-0 bg-transparent ${inputPadding} ${inputTextStyling} ${hideSpinnersClass} focus:!outline-none !border-none !ring-0 !shadow-none`}
        autoComplete="off"
      />
      <span
        className="flex items-center bg-transparent !text-gray-400 !px-3 !text-lg !border-none !ring-0 !shadow-none"
      >
        {addonText}
      </span>
    </div>
  );
};

// CustomFormRow (remains the same)
const CustomFormRow = ({ labelIcon: Icon, labelText, children, isCheckboxRow = false }) => (
  <div className={`flex justify-between items-center py-3.5 border-b border-gray-700 ${isCheckboxRow ? 'last:border-b-0' : ''}`}>
    <span className="text-gray-300 flex items-center text-sm sm:text-base">
      {Icon && <Icon size={18} className="mr-2.5 text-zinc-400 flex-shrink-0" />}
      {labelText ? `${labelText}:` : ''} {/* Conditionally add colon, or handle empty labelText */}
    </span>
    <div className={`${isCheckboxRow ? 'flex justify-end' : 'w-[55%] sm:w-2/5'}`}>
      {children}
    </div>
  </div>
);


const CalculatorForm = ({
  defaultApy,
  onValuesChange,
  isCustomApy,
  initialValues,
  isApyLoading
}) => {

  const handleInputChange = (fieldName, inputValue) => {
    let valueToSet;
    if (typeof inputValue === 'boolean') {
      valueToSet = inputValue;
    } else if (inputValue === '' || inputValue === undefined || inputValue === null) {
      valueToSet = undefined;
    } else {
      const num = parseFloat(inputValue);
      valueToSet = isNaN(num) ? undefined : num;
    }

    if (onValuesChange) {
      const allUpdatedValues = {
        ...initialValues,
        [fieldName]: valueToSet,
      };
      onValuesChange({ [fieldName]: valueToSet }, allUpdatedValues);
    }
  };

  return (
    <Form
      layout="vertical"
      initialValues={initialValues}
      className="space-y-0"
    >
      <CustomFormRow labelIcon={Wallet} labelText="Amount of APT to stake">
        <Form.Item
          name="aptAmount"
          rules={[{ required: true, message: 'Please enter a valid APT amount' }]}
          className="!mb-0"
        >
          <StyledNumberInputWithAddon
            name="aptAmount" // name prop here is not strictly necessary if Form.Item has it
            value={initialValues?.aptAmount}
            onChange={(e) => handleInputChange('aptAmount', e.target.value)}
            placeholder="1000"
            addonText="APT"
            min={0}
          />
        </Form.Item>
      </CustomFormRow>

      {/* --- MODIFIED CHECKBOX ROW START --- */}
      <CustomFormRow
        labelIcon={SlidersHorizontal} // Icon now on the left
        labelText="Specify your own APY"  // Text now on the left
        isCheckboxRow={true} // Keeps border logic and right-aligns the Checkbox input itself
      >
        <Form.Item
          name="useCustomApy"
          valuePropName="checked"
          className="!mb-0" // Ensures Form.Item itself doesn't add extra margin
          onChange={(e) => handleInputChange('useCustomApy', e.target.checked)}
        >
          {/* The Checkbox no longer contains its own text label or icon */}
          <Checkbox />
        </Form.Item>
      </CustomFormRow>
      {/* --- MODIFIED CHECKBOX ROW END --- */}

      {isCustomApy ? (
        <CustomFormRow labelIcon={Percent} labelText="Custom APY (%)">
          <Form.Item
            name="customApy"
            rules={[{ required: true, message: 'Please enter a valid APY' }]}
            className="!mb-0"
            tooltip={{
              title: "Enter the annual percentage yield you expect (e.g., 7.5 for 7.5%).",
              icon: <InfoCircleOutlined className="text-gray-400" />
            }}
          >
            <StyledNumberInputWithAddon
              name="customApy" // name prop here is not strictly necessary if Form.Item has it
              value={initialValues?.customApy}
              onChange={(e) => handleInputChange('customApy', e.target.value)}
              placeholder="7.5"
              addonText="%"
              min={0}
              max={100}
            />
          </Form.Item>
        </CustomFormRow>
      ) : (
        <div className="py-3.5 border-b border-gray-700 last:border-b-0">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 flex items-center text-sm sm:text-base">
              <InfoCircleOutlined className="mr-2.5 text-zinc-400" />
              Current estimated network APY:
            </span>
            <div className="text-right">
              <Text strong className="text-lg font-semibold text-zinc-300">
                {isApyLoading ? 'Loading...' : (defaultApy !== null && defaultApy !== undefined ? `${defaultApy.toFixed(2)}%` : 'N/A')}
              </Text>
            </div>
          </div>
        </div>
      )}
    </Form>
  );
};

export default CalculatorForm;