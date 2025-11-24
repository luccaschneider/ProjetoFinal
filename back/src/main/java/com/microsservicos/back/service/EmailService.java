package com.microsservicos.back.service;

import com.microsservicos.back.domain.Event;
import com.microsservicos.back.domain.Usuario;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from}")
    private String fromEmail;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

    @Async
    public void enviarEmailConfirmacaoCadastro(Usuario usuario) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(usuario.getEmail());
            message.setSubject("Bem-vindo! Cadastro confirmado");
            message.setText(String.format(
                    "Olá %s,\n\n" +
                    "Seu cadastro foi realizado com sucesso!\n\n" +
                    "Agora você pode acessar nossa plataforma e participar dos eventos disponíveis.\n\n" +
                    "Dados do cadastro:\n" +
                    "- Nome: %s\n" +
                    "- Email: %s\n\n" +
                    "Se você não realizou este cadastro, por favor, entre em contato conosco.\n\n" +
                    "Atenciosamente,\n" +
                    "Equipe de Eventos",
                    usuario.getName(),
                    usuario.getName(),
                    usuario.getEmail()
            ));
            mailSender.send(message);
            log.info("Email de confirmação de cadastro enviado para: {}", usuario.getEmail());
        } catch (Exception e) {
            log.error("Erro ao enviar email de confirmação de cadastro para: {}", usuario.getEmail(), e);
        }
    }

    @Async
    public void enviarEmailConfirmacaoInscricao(Usuario usuario, Event event) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(usuario.getEmail());
            message.setSubject("Inscrição confirmada - " + event.getNome());
            message.setText(String.format(
                    "Olá %s,\n\n" +
                    "Sua inscrição no evento foi confirmada com sucesso!\n\n" +
                    "Detalhes do evento:\n" +
                    "- Nome: %s\n" +
                    "- Data/Hora de Início: %s\n" +
                    "- Data/Hora de Término: %s\n" +
                    "- Local: %s\n" +
                    "- Categoria: %s\n" +
                    "%s\n\n" +
                    "Não se esqueça de comparecer no dia e horário marcados!\n\n" +
                    "Atenciosamente,\n" +
                    "Equipe de Eventos",
                    usuario.getName(),
                    event.getNome(),
                    event.getDataHoraInicio().format(DATE_TIME_FORMATTER),
                    event.getDataHoraFim().format(DATE_TIME_FORMATTER),
                    event.getLocalEvento() != null ? event.getLocalEvento() : "A definir",
                    event.getCategoria() != null ? event.getCategoria() : "Sem categoria",
                    event.getDetalhes() != null && !event.getDetalhes().isEmpty() 
                        ? "- Detalhes: " + event.getDetalhes() + "\n" 
                        : ""
            ));
            mailSender.send(message);
            log.info("Email de confirmação de inscrição enviado para: {} no evento: {}", usuario.getEmail(), event.getNome());
        } catch (Exception e) {
            log.error("Erro ao enviar email de confirmação de inscrição para: {} no evento: {}", 
                    usuario.getEmail(), event.getNome(), e);
        }
    }

    @Async
    public void enviarEmailCancelamentoInscricao(Usuario usuario, Event event) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(usuario.getEmail());
            message.setSubject("Inscrição cancelada - " + event.getNome());
            message.setText(String.format(
                    "Olá %s,\n\n" +
                    "Sua inscrição no evento foi cancelada com sucesso.\n\n" +
                    "Detalhes do evento cancelado:\n" +
                    "- Nome: %s\n" +
                    "- Data/Hora de Início: %s\n" +
                    "- Local: %s\n\n" +
                    "Caso tenha cancelado por engano ou queira se inscrever novamente, " +
                    "você pode fazer isso através da nossa plataforma.\n\n" +
                    "Atenciosamente,\n" +
                    "Equipe de Eventos",
                    usuario.getName(),
                    event.getNome(),
                    event.getDataHoraInicio().format(DATE_TIME_FORMATTER),
                    event.getLocalEvento() != null ? event.getLocalEvento() : "A definir"
            ));
            mailSender.send(message);
            log.info("Email de cancelamento de inscrição enviado para: {} no evento: {}", usuario.getEmail(), event.getNome());
        } catch (Exception e) {
            log.error("Erro ao enviar email de cancelamento de inscrição para: {} no evento: {}", 
                    usuario.getEmail(), event.getNome(), e);
        }
    }

    @Async
    public void enviarEmailConfirmacaoPresenca(Usuario usuario, Event event) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(usuario.getEmail());
            message.setSubject("Presença confirmada - " + event.getNome());
            message.setText(String.format(
                    "Olá %s,\n\n" +
                    "Sua presença no evento foi confirmada!\n\n" +
                    "Detalhes do evento:\n" +
                    "- Nome: %s\n" +
                    "- Data/Hora de Início: %s\n" +
                    "- Data/Hora de Término: %s\n" +
                    "- Local: %s\n\n" +
                    "Obrigado por participar do nosso evento!\n\n" +
                    "Atenciosamente,\n" +
                    "Equipe de Eventos",
                    usuario.getName(),
                    event.getNome(),
                    event.getDataHoraInicio().format(DATE_TIME_FORMATTER),
                    event.getDataHoraFim().format(DATE_TIME_FORMATTER),
                    event.getLocalEvento() != null ? event.getLocalEvento() : "A definir"
            ));
            mailSender.send(message);
            log.info("Email de confirmação de presença enviado para: {} no evento: {}", usuario.getEmail(), event.getNome());
        } catch (Exception e) {
            log.error("Erro ao enviar email de confirmação de presença para: {} no evento: {}", 
                    usuario.getEmail(), event.getNome(), e);
        }
    }

    @Async
    public void enviarEmailCadastroRapidoComPresenca(Usuario usuario, Event event) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(usuario.getEmail());
            message.setSubject("Bem-vindo! Cadastro e presença confirmados - " + event.getNome());
            message.setText(String.format(
                    "Olá %s,\n\n" +
                    "Seu cadastro foi realizado e sua presença no evento foi confirmada!\n\n" +
                    "Detalhes do evento:\n" +
                    "- Nome: %s\n" +
                    "- Data/Hora de Início: %s\n" +
                    "- Data/Hora de Término: %s\n" +
                    "- Local: %s\n\n" +
                    "Dados do seu cadastro:\n" +
                    "- Nome: %s\n" +
                    "- Email: %s\n\n" +
                    "IMPORTANTE: Uma senha temporária foi gerada para você. " +
                    "Por favor, altere sua senha no primeiro acesso.\n\n" +
                    "Obrigado por participar do nosso evento!\n\n" +
                    "Atenciosamente,\n" +
                    "Equipe de Eventos",
                    usuario.getName(),
                    event.getNome(),
                    event.getDataHoraInicio().format(DATE_TIME_FORMATTER),
                    event.getDataHoraFim().format(DATE_TIME_FORMATTER),
                    event.getLocalEvento() != null ? event.getLocalEvento() : "A definir",
                    usuario.getName(),
                    usuario.getEmail()
            ));
            mailSender.send(message);
            log.info("Email de cadastro rápido com presença enviado para: {} no evento: {}", usuario.getEmail(), event.getNome());
        } catch (Exception e) {
            log.error("Erro ao enviar email de cadastro rápido com presença para: {} no evento: {}", 
                    usuario.getEmail(), event.getNome(), e);
        }
    }

    @Async
    public void enviarEmailCertificadoEmitido(Usuario usuario, Event event, String certificateCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(usuario.getEmail());
            message.setSubject("Certificado emitido - " + event.getNome());
            message.setText(String.format(
                    "Olá %s,\n\n" +
                    "Seu certificado de participação foi emitido com sucesso!\n\n" +
                    "Detalhes do certificado:\n" +
                    "- Código do Certificado: %s\n" +
                    "- Evento: %s\n" +
                    "- Data/Hora de Início: %s\n" +
                    "- Data/Hora de Término: %s\n" +
                    "- Local: %s\n\n" +
                    "Você pode baixar seu certificado através do código acima ou acessando o link de download.\n\n" +
                    "Para validar seu certificado, use o código: %s\n\n" +
                    "Parabéns pela participação no evento!\n\n" +
                    "Atenciosamente,\n" +
                    "Equipe de Eventos",
                    usuario.getName(),
                    certificateCode,
                    event.getNome(),
                    event.getDataHoraInicio().format(DATE_TIME_FORMATTER),
                    event.getDataHoraFim().format(DATE_TIME_FORMATTER),
                    event.getLocalEvento() != null ? event.getLocalEvento() : "A definir",
                    certificateCode
            ));
            mailSender.send(message);
            log.info("Email de certificado emitido enviado para: {} no evento: {} com código: {}", 
                    usuario.getEmail(), event.getNome(), certificateCode);
        } catch (Exception e) {
            log.error("Erro ao enviar email de certificado emitido para: {} no evento: {} com código: {}", 
                    usuario.getEmail(), event.getNome(), certificateCode, e);
        }
    }
}

