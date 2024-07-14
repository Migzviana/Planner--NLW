import React, { createContext, useContext } from 'react';
import { View, Text, TextProps, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import clsx from 'clsx';

type Variants = "primary" | "secondary";

type ButtonProps = TouchableOpacityProps & {
  variant?: Variants;
  isLoading?: boolean;
};

const ThemeContext = createContext<{ variant?: Variants }>({});

function Button({
  variant = "primary",
  children,
  isLoading,
  className,
  ...rest
}: ButtonProps) {
  return (
    <View
      className={clsx(
        "h-11 rounded-lg flex-row items-center justify-center gap-2 px-2 ",
        {
          "bg-lime-300": variant === "primary",
          "bg-zinc-800": variant === "secondary",
        },
        className
      )}
    >
      <TouchableOpacity
        disabled={isLoading}
        activeOpacity={0.7}
        {...rest}
      >
        <ThemeContext.Provider value={{ variant }}>
          {isLoading ? (
            <ActivityIndicator className="text-lime-950" />
          ) : (
            children
          )}
        </ThemeContext.Provider>
      </TouchableOpacity>
    </View>
  );
}

function Title({ children, ...rest }: TextProps) {
  const { variant } = useContext(ThemeContext);
  return (
    <Text
      className={clsx("text-base font-semibold", {
        "text-lime-950": variant === "primary",
        "text-zinc-200": variant === "secondary",
      })}
      {...rest}
    >
      {children}
    </Text>
  );
}

Button.Title = Title;

export { Button };