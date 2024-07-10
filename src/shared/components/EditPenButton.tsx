import React from "react";

export interface EditPenButtonProps {
    [key: string]: any;
}

export function EditPenButton({
    className = 'flex items-center justify-center rounded-lg font-medium text-white',
    svgClassName = '',
    ...rest }: EditPenButtonProps) {

    return <button className={className} aria-label="Edit pen" {...rest}>
        <svg className={svgClassName} width="15" height="16" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.49999 9L8.99994 9.54702C8.73473 9.83706 8.37507 10 8.00006 10C7.62505 10 7.2654 9.83706 7.00019 9.54702C6.73461 9.25756 6.37499 9.09503 6.00009 9.09503C5.62519 9.09503 5.26557 9.25756 4.99999 9.54702M0.5 9.99999H1.33727C1.58186 9.99999 1.70416 9.99999 1.81925 9.97236C1.92128 9.94786 2.01883 9.90746 2.1083 9.85263C2.20921 9.79079 2.29569 9.70431 2.46864 9.53136L8.75001 3.24999C9.16423 2.83578 9.16423 2.1642 8.75001 1.74999C8.3358 1.33578 7.66423 1.33578 7.25001 1.74999L0.96863 8.03136C0.795678 8.20431 0.709202 8.29079 0.64736 8.39171C0.592531 8.48118 0.552127 8.57872 0.52763 8.68076C0.5 8.79585 0.5 8.91814 0.5 9.16273V9.99999Z" stroke="#CECFD2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

    </button>
}
