import forms from './forms.json';

export type FormConfig = typeof forms[keyof typeof forms];
export type FormsConfig = typeof forms;

export default forms; 