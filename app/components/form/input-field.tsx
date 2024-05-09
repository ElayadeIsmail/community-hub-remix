import { Label } from '@radix-ui/react-label';
import React, { useId } from 'react';
import { ListOfErrors } from '~/types';
import { cn } from '~/utils/misc.tsx';
import { Input } from '../ui';
import { ErrorList } from './errors-list';

interface Props {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
	inputProps: React.InputHTMLAttributes<HTMLInputElement>;
	className?: string;
	errors: ListOfErrors;
}

export const InputFiled: React.FC<Props> = ({
	errors,
	inputProps,
	labelProps,
	className,
}) => {
	const fallbackId = useId();
	const id = inputProps.id ?? fallbackId;
	const errorId = errors?.length ? `${id}-error` : undefined;
	return (
		<div className={cn('flex flex-col', className)}>
			<Label htmlFor={id} {...labelProps} />
			<Input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			/>
			<div className='min-h-[32px] px-4 pb-3 pt-1'>
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	);
};
