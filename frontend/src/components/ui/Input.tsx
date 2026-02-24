import { InputHTMLAttributes } from 'react';
export function Input(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element { return <input {...props} className={"rounded border px-3 py-2 " + (props.className || '')} />; }
