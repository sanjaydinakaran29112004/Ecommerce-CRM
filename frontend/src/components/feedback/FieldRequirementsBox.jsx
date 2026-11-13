import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * FieldRequirementsBox
 * Exact visual match to enterprise password and input validation guidelines callout box.
 * Displays required criteria in a light-blue panel with real-time satisfied / unsatisfied states.
 */
export function FieldRequirementsBox({
  type = 'custom',
  value = '',
  rules = [],
  className,
  title,
}) {
  let computedRules = rules;

  if (type === 'password') {
    const val = String(value || '');
    computedRules = [
      {
        id: 'min_8',
        label: 'Password must be at least 8 characters long.',
        satisfied: val.length >= 8,
      },
      {
        id: 'max_18',
        label: 'Password must not be longer than 18 characters.',
        satisfied: val.length > 0 && val.length <= 18,
      },
      {
        id: 'case_mix',
        label: 'Password must contain at least one upper case and one lower case letter.',
        satisfied: /[A-Z]/.test(val) && /[a-z]/.test(val),
      },
      {
        id: 'num_sym',
        label: 'Password must contain at least one number or punctuation character.',
        satisfied: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
      },
      {
        id: 'no_space',
        label: 'Password must not contain space or unicode characters.',
        satisfied: val.length > 0 && /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(val),
      },
    ];
  } else if (type === 'name') {
    const val = String(value || '').trim();
    computedRules = [
      {
        id: 'name_len',
        label: 'Name must be at least 3 characters long.',
        satisfied: val.length >= 3,
      },
      {
        id: 'name_chars',
        label: 'Name must contain only alphabets and spaces (no numbers or special characters).',
        satisfied: val.length > 0 && /^[A-Za-z\s.]+$/.test(val),
      },
    ];
  } else if (type === 'account' || type === 'accountNumber') {
    const val = String(value || '').trim();
    computedRules = [
      {
        id: 'acc_len',
        label: 'Account number must be between 9 and 18 digits long.',
        satisfied: val.length >= 9 && val.length <= 18,
      },
      {
        id: 'acc_digits',
        label: 'Account number must contain only numeric digits (0-9).',
        satisfied: val.length > 0 && /^\d+$/.test(val),
      },
    ];
  } else if (type === 'phone') {
    const clean = String(value || '').replace(/[\s\-\+]/g, '');
    const tenDigits = clean.length >= 10 ? clean.slice(-10) : clean;
    computedRules = [
      {
        id: 'phone_digits',
        label: 'Phone number must be exactly 10 digits.',
        satisfied: tenDigits.length === 10 && /^\d{10}$/.test(tenDigits),
      },
      {
        id: 'phone_start',
        label: 'Must start with a valid Indian mobile digit (6, 7, 8, or 9).',
        satisfied: /^[6-9]/.test(tenDigits),
      },
    ];
  } else if (type === 'pincode') {
    const val = String(value || '').trim();
    computedRules = [
      {
        id: 'pin_len',
        label: 'Pincode must be exactly 6 digits.',
        satisfied: val.length === 6 && /^\d{6}$/.test(val),
      },
      {
        id: 'pin_num',
        label: 'Must contain only numeric numbers (0-9).',
        satisfied: val.length > 0 && /^\d+$/.test(val),
      },
    ];
  } else if (type === 'email') {
    const val = String(value || '').trim();
    computedRules = [
      {
        id: 'email_at',
        label: 'Email must contain a valid @ and domain extension (e.g. name@domain.com).',
        satisfied: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      },
    ];
  }

  if (!computedRules || computedRules.length === 0) return null;

  return (
    <div
      className={cn(
        'bg-[#eef6fc] border border-[#bcdbf5] rounded-md p-3.5 text-xs text-[#1e5a8a] animate-in fade-in duration-150',
        className
      )}
    >
      {title && <div className="font-semibold text-[#154670] mb-1.5">{title}</div>}
      <ul className="list-disc pl-4 space-y-1.5 leading-relaxed text-[#2c5f88]">
        {computedRules.map((rule, idx) => {
          const isSatisfied = rule.satisfied;
          return (
            <li
              key={rule.id || idx}
              className={cn(
                'transition-colors',
                isSatisfied && 'text-emerald-700 font-medium'
              )}
            >
              <span className="flex items-start gap-1.5">
                <span>{rule.label}</span>
                {isSatisfied && (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5 inline-block" />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

