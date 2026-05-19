import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface FormErrorMessage {
  required?: string;
  min?: string;
  minlength?: string;
  max?: string;
  maxlength?: string;
  notOnlySpaces?: string;
  onlyTextWithoutNumbers?: string;
  email?: string;
  arabicPattern?: string;
  englishPattern?: string;
  uaePhoneNumber?: string;
  passwordComplexityValidator?: string;
  usernameValidation?: string;
  decimalOrSingleOneValidator?: string;
  passwordMismatch?: string;
  digitsOnlyError?: string;
  emailOrPhoneNumberError?: string;
  minAge?: string;
  invalidCurrentPassword?: string;
}

@Component({
  selector: 'app-form-errors',
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './form-errors.component.html',
  styleUrl: './form-errors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorsComponent {
  translate = inject(TranslateService);
  control = input.required<AbstractControl | null>();
  messages = input<FormErrorMessage>();
  data = input<{ maxLength?: number; minLength?: number }>();
}
