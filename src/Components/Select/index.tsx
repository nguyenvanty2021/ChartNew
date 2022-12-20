import { Controller, useFormContext } from "react-hook-form";
import { Select } from "antd";
import { CaretDownOutlined } from "@ant-design/icons";
import TextErrors from "../TextErrors";
import { TimeRangeProps } from "../../App";
const { Option } = Select;
const SelectComponent = ({
  name,
  data,
  className,
  placeholder,
  icon,
}: {
  name: string;
  data: TimeRangeProps<string>[];
  className?: string;
  placeholder: string;
  icon?: boolean;
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        return (
          <div className={className}>
            <Select
              suffixIcon={
                icon ? (
                  <CaretDownOutlined
                    style={{ color: "black", fontSize: "1rem" }}
                  />
                ) : undefined
              }
              style={{ width: "100%" }}
              showSearch
              placeholder={placeholder}
              optionFilterProp="children"
              // onChange={onChange}
              // onSearch={onSearch}
              filterOption={(input, option) =>
                (option!.children as unknown as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              {...field}
            >
              {data?.length > 0 &&
                data.map((values, index) => {
                  return (
                    <Option key={index} value={values.value}>
                      {values.key}
                    </Option>
                  );
                })}
            </Select>
            {errors[name]?.message && (
              <TextErrors message={errors[name]?.message} />
            )}
          </div>
        );
      }}
    />
  );
};
export default SelectComponent;
