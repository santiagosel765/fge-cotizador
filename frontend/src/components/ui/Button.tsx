import { ButtonHTMLAttributes } from 'react';
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element { return <button {...props} className={"rounded bg-blue-600 px-3 py-2 text-white " + (props.className || '')} />; }
