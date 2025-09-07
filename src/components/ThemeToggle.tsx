import React from 'react';
import { ActionIcon, Tooltip, Group, Text } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { colorScheme, toggleTheme, isDark } = useTheme();

  const getIcon = () => {
    switch (colorScheme) {
      case 'light':
        return <IconSun size={16} />;
      case 'dark':
        return <IconMoon size={16} />;
      case 'auto':
        return <IconDeviceDesktop size={16} />;
      default:
        return <IconSun size={16} />;
    }
  };

  const getTooltip = () => {
    switch (colorScheme) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to auto mode';
      case 'auto':
        return 'Switch to light mode';
      default:
        return 'Toggle theme';
    }
  };

  const getLabel = () => {
    switch (colorScheme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto';
      default:
        return 'Theme';
    }
  };

  return (
    <Tooltip label={getTooltip()}>
      <Group gap="xs">
        <ActionIcon
          variant="light"
          size="sm"
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label={getTooltip()}
        >
          {getIcon()}
        </ActionIcon>
        <Text size="xs" c="dimmed" style={{ minWidth: '40px' }}>
          {getLabel()}
        </Text>
      </Group>
    </Tooltip>
  );
}

export function ThemeToggleCompact() {
  const { colorScheme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (colorScheme) {
      case 'light':
        return <IconSun size={16} />;
      case 'dark':
        return <IconMoon size={16} />;
      case 'auto':
        return <IconDeviceDesktop size={16} />;
      default:
        return <IconSun size={16} />;
    }
  };

  const getTooltip = () => {
    switch (colorScheme) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to auto mode';
      case 'auto':
        return 'Switch to light mode';
      default:
        return 'Toggle theme';
    }
  };

  return (
    <Tooltip label={getTooltip()}>
      <ActionIcon
        variant="light"
        size="sm"
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label={getTooltip()}
      >
        {getIcon()}
      </ActionIcon>
    </Tooltip>
  );
}
