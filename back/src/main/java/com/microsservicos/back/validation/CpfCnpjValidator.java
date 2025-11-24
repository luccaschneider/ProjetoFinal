package com.microsservicos.back.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CpfCnpjValidator implements ConstraintValidator<CpfCnpj, String> {

    @Override
    public void initialize(CpfCnpj constraintAnnotation) {
    }

    @Override
    public boolean isValid(String documento, ConstraintValidatorContext context) {
        if (documento == null || documento.trim().isEmpty()) {
            return true; // Opcional, então null/vazio é válido
        }

        // Remove formatação
        String documentoLimpo = documento.replaceAll("[^0-9]", "");

        // CPF tem 11 dígitos, CNPJ tem 14 dígitos
        return documentoLimpo.length() == 11 || documentoLimpo.length() == 14;
    }
}

