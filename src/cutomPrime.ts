import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { button } from '@primeuix/themes/aura/inputnumber';

export const CustomTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e6f0fa',
      100: '#cce2f5',
      200: '#99c6eb',
      300: '#66a9e0',
      400: '#338dd6',
      500: '#005CAC',
      600: '#004a96',
      700: '#003a78',
      800: '#002b5a',
      900: '#001c3c',
    },
  },
});
