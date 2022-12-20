import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import TextErrors from "../TextErrors";
import styles from "./Input.module.scss";
const InputComponent = ({
  name,
  placeholder,
  icon,
  disable,
  type,
  iconPosition,

  className,
}: {
  type: string;
  name: string;
  disable?: boolean;
  className?: string;
  placeholder: string;

  icon?: any;
  iconPosition?: string;
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
            <div className={styles.input}>
              <div
                className={
                  errors[name]?.message
                    ? styles.input__borderError
                    : styles.input__border
                }
              >
                {iconPosition && icon ? icon : ""}
                <input
                  disabled={disable}
                  type={type}
                  className={
                    icon
                      ? !iconPosition
                        ? styles.input__icon
                        : styles.input__iconFirst
                      : styles.input__noneIcon
                  }
                  {...field}
                  placeholder={placeholder}
                />
                {!iconPosition && icon ? icon : ""}
              </div>
            </div>
            {errors[name]?.message && (
              <TextErrors message={errors[name]?.message} />
            )}
          </div>
        );
      }}
    />
  );
};
export default memo(InputComponent);
