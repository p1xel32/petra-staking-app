import React from 'react';
import { Form, Checkbox, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Wallet, Percent, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

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

const CustomFormRow = ({ labelIcon: Icon, labelText, children, isCheckboxRow = false }) => (
  <div className={`flex justify-between items-center py-3.5 border-b border-gray-700 ${isCheckboxRow ? 'last:border-b-0' : ''}`}>
    <span className="text-gray-300 flex items-center text-sm sm:text-base">
      {Icon && <Icon size={18} className="mr-2.5 text-zinc-400 flex-shrink-0" />}
      {labelText ? `${labelText}:` : ''}
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
  const { t } = useTranslation();

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
      <CustomFormRow labelIcon={Wallet} labelText={t('apyCalculatorPage.form.amountLabel')}>
        <Form.Item
          name="aptAmount"
          rules={[{ required: true, message: t('apyCalculatorPage.form.amountError') }]}
          className="!mb-0"
        >
          <StyledNumberInputWithAddon
            name="aptAmount"
            value={initialValues?.aptAmount}
            onChange={(e) => handleInputChange('aptAmount', e.target.value)}
            placeholder={t('apyCalculatorPage.form.amountPlaceholder')}
            addonText="APT"
            min={0}
          />
        </Form.Item>
      </CustomFormRow>

      <CustomFormRow
        labelIcon={SlidersHorizontal}
        labelText={t('apyCalculatorPage.form.specifyApyLabel')}
        isCheckboxRow={true}
      >
        <Form.Item
          name="useCustomApy"
          valuePropName="checked"
          className="!mb-0"
          onChange={(e) => handleInputChange('useCustomApy', e.target.checked)}
        >
          <Checkbox />
        </Form.Item>
      </CustomFormRow>

      {isCustomApy ? (
        <CustomFormRow labelIcon={Percent} labelText={t('apyCalculatorPage.form.customApyLabel')}>
          <Form.Item
            name="customApy"
            rules={[{ required: true, message: t('apyCalculatorPage.form.customApyError') }]}
            className="!mb-0"
            tooltip={{
              title: t('apyCalculatorPage.form.customApyTooltip'),
              icon: <InfoCircleOutlined className="text-gray-400" />
            }}
          >
            <StyledNumberInputWithAddon
              name="customApy"
              value={initialValues?.customApy}
              onChange={(e) => handleInputChange('customApy', e.target.value)}
              placeholder={t('apyCalculatorPage.form.customApyPlaceholder')}
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
              {t('apyCalculatorPage.form.currentApyLabel')}:
            </span>
            <div className="text-right">
              <Text strong className="text-lg font-semibold text-zinc-300">
                {isApyLoading ? t('apyCalculatorPage.form.loading') : (defaultApy !== null && defaultApy !== undefined ? `${defaultApy.toFixed(2)}%` : t('apyCalculatorPage.form.notAvailable'))}
              </Text>
            </div>
          </div>
        </div>
      )}
    </Form>
  );
};

export default CalculatorForm;