package com.microsservicos.back.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = CpfCnpjValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface CpfCnpj {
    String message() default "Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

