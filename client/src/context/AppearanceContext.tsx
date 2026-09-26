import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type FontSizeOption = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconStyleOption = 'animated' | 'solid' | 'minimal';

interface AppearanceContextType {
  fontSize: FontSizeOption;
  uiScale: number;
  iconStyle: IconStyleOption;
  setFontSize: (size: FontSizeOption) => void;
  setUiScale: (scale: number) => void;
  setIconStyle: (style: IconStyleOption) => void;
  saveAppearance: (options: {
    fontSize?: FontSizeOption;
    uiScale?: number;
    iconStyle?: IconStyleOption;
  }) => Promise<boolean>;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const FONT_SIZE_PX_MAP: Record<FontSizeOption, string> = {
  xs: '13px',
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
};

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updatePreferences } = useAuth();

  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
    return (user?.preferences?.fontSize as FontSizeOption) || 'md';
  });

  const [uiScale, setUiScaleState] = useState<number>(() => {
    return user?.preferences?.uiScale ?? 1.0;
  });

  const [iconStyle, setIconStyleState] = useState<IconStyleOption>(() => {
    return (user?.preferences?.iconStyle as IconStyleOption) || 'animated';
  });

  // Sync with user preferences when user loads or updates
  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.fontSize) {
        setFontSizeState(user.preferences.fontSize as FontSizeOption);
      }
      if (user.preferences.uiScale !== undefined) {
        setUiScaleState(user.preferences.uiScale);
      }
      if (user.preferences.iconStyle) {
        setIconStyleState(user.preferences.iconStyle as IconStyleOption);
      }
    }
  }, [user?.preferences?.fontSize, user?.preferences?.uiScale, user?.preferences?.iconStyle]);

  // Apply visual styling to document root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-size', fontSize);
    root.setAttribute('data-ui-scale', String(uiScale));
    root.setAttribute('data-icon-style', iconStyle);

    // Dynamic base font size scaling
    root.style.fontSize = FONT_SIZE_PX_MAP[fontSize] || '16px';

    // Dynamic UI Zoom scaling across all windows and controls
    const bodyStyle = document.body.style as any;
    if ('zoom' in bodyStyle) {
      bodyStyle.zoom = String(uiScale);
    } else {
      bodyStyle.transform = `scale(${uiScale})`;
      bodyStyle.transformOrigin = 'top left';
    }
  }, [fontSize, uiScale, iconStyle]);

  const setFontSize = (size: FontSizeOption) => {
    setFontSizeState(size);
    updatePreferences({ fontSize: size });
  };

  const setUiScale = (scale: number) => {
    setUiScaleState(scale);
    updatePreferences({ uiScale: scale });
  };

  const setIconStyle = (style: IconStyleOption) => {
    setIconStyleState(style);
    updatePreferences({ iconStyle: style });
  };

  const saveAppearance = async (options: {
    fontSize?: FontSizeOption;
    uiScale?: number;
    iconStyle?: IconStyleOption;
  }) => {
    if (options.fontSize) setFontSizeState(options.fontSize);
    if (options.uiScale !== undefined) setUiScaleState(options.uiScale);
    if (options.iconStyle) setIconStyleState(options.iconStyle);

    return await updatePreferences({
      ...(options.fontSize && { fontSize: options.fontSize }),
      ...(options.uiScale !== undefined && { uiScale: options.uiScale }),
      ...(options.iconStyle && { iconStyle: options.iconStyle }),
    });
  };

  return (
    <AppearanceContext.Provider
      value={{
        fontSize,
        uiScale,
        iconStyle,
        setFontSize,
        setUiScale,
        setIconStyle,
        saveAppearance,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = (): AppearanceContextType => {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};
