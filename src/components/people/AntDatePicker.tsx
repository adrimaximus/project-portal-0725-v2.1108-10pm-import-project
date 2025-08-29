import React from 'react';
import { DatePicker } from 'antd';
import type { DatePickerProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

interface AntDatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
}

const AntDatePicker: React.FC<AntDatePickerProps> = ({ value, onChange }) => {
  const dayjsValue = value ? dayjs(value) : null;

  const handleChange: DatePickerProps['onChange'] = (date: Dayjs | null) => {
    onChange(date ? date.toDate() : null);
  };

  return (
    <DatePicker 
      value={dayjsValue} 
      onChange={handleChange} 
      needConfirm 
      style={{ width: '100%' }} 
      picker="date"
    />
  );
};

export default AntDatePicker;