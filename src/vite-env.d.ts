/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'md-filled-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { disabled?: boolean, type?: string, form?: string };
      'md-outlined-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { disabled?: boolean };
      'md-text-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { disabled?: boolean };
      'md-filled-tonal-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { disabled?: boolean };
      'md-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { disabled?: boolean, type?: string };
      'md-filled-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { disabled?: boolean };
      'md-outlined-text-field': React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & { label?: string, type?: string, value?: string, required?: boolean, error?: boolean, errorText?: string };
      'md-filled-text-field': React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & { label?: string, type?: string, value?: string, required?: boolean, error?: boolean, errorText?: string };
      'md-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { checked?: boolean, disabled?: boolean };
      'md-switch': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { selected?: boolean, disabled?: boolean };
      'md-chip-set': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'md-filter-chip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { label?: string, selected?: boolean };
      'md-assist-chip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { label?: string };
      'md-tabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'md-primary-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { active?: boolean };
      'md-secondary-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { active?: boolean };
      'md-dialog': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { open?: boolean };
      'md-divider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'md-fab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { variant?: string, size?: string, label?: string };
      'md-circular-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { indeterminate?: boolean };
      'md-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'md-list-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { type?: string };
      'md-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { open?: boolean, anchor?: string };
      'md-menu-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'md-circular-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { indeterminate?: boolean, value?: number };
      'md-linear-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { indeterminate?: boolean, value?: number };
      'md-ripple': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'md-outlined-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { label?: string };
      'md-select-option': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { value?: string, selected?: boolean };
      'md-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
