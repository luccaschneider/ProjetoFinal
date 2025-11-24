package com.microsservicos.back.config;

import com.microsservicos.back.domain.Event;
import com.microsservicos.back.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(2) // Executa após o DatabaseInitializer
public class EventInitializer implements CommandLineRunner {

    private final EventRepository eventRepository;

    @Override
    public void run(String... args) {
        if (eventRepository.count() == 0) {
            log.info("Inicializando eventos no banco de dados...");
            criarEventosIniciais();
            log.info("Eventos inicializados com sucesso!");
        } else {
            log.info("Eventos já existem no banco de dados. Pulando inicialização.");
        }
    }

    private void criarEventosIniciais() {
        LocalDateTime agora = LocalDateTime.now();

        List<Event> eventos = Arrays.asList(
            Event.builder()
                .nome("Hamlet - Peça de Teatro")
                .detalhes("Apresentação clássica da obra de William Shakespeare. Uma tragédia sobre vingança, traição e loucura. Com elenco renomado e direção premiada.")
                .dataHoraInicio(agora.plusDays(15).withHour(20).withMinute(0))
                .dataHoraFim(agora.plusDays(15).withHour(22).withMinute(30))
                .localEvento("Teatro Municipal")
                .categoria("Teatro")
                .capacidadeMaxima(500)
                .precoIngresso(new BigDecimal("80.00"))
                .ativo(true)
                .build(),

            Event.builder()
                .nome("Show de Standup - Comédia Stand-up")
                .detalhes("Noite de muito humor com os melhores comediantes do país. Stand-up comedy com piadas sobre o dia a dia, relacionamentos e situações engraçadas.")
                .dataHoraInicio(agora.plusDays(7).withHour(21).withMinute(0))
                .dataHoraFim(agora.plusDays(7).withHour(23).withMinute(0))
                .localEvento("Casa de Shows Comedy Club")
                .categoria("Stand-up")
                .capacidadeMaxima(300)
                .precoIngresso(new BigDecimal("60.00"))
                .ativo(true)
                .build(),

            Event.builder()
                .nome("Concerto de Música Clássica")
                .detalhes("Orquestra Sinfônica apresenta obras de Mozart, Beethoven e Bach. Uma experiência musical inesquecível com músicos de renome internacional.")
                .dataHoraInicio(agora.plusDays(20).withHour(19).withMinute(30))
                .dataHoraFim(agora.plusDays(20).withHour(22).withMinute(0))
                .localEvento("Sala de Concertos")
                .categoria("Música")
                .capacidadeMaxima(800)
                .precoIngresso(new BigDecimal("120.00"))
                .ativo(true)
                .build(),

            Event.builder()
                .nome("Festival de Rock Nacional")
                .detalhes("Festival com as maiores bandas de rock do Brasil. Música ao vivo, food trucks e muito mais. Não perca!")
                .dataHoraInicio(agora.plusDays(30).withHour(16).withMinute(0))
                .dataHoraFim(agora.plusDays(30).withHour(23).withMinute(59))
                .localEvento("Parque de Exposições")
                .categoria("Música")
                .capacidadeMaxima(5000)
                .precoIngresso(new BigDecimal("150.00"))
                .ativo(true)
                .build(),

            Event.builder()
                .nome("O Mágico de Oz - Musical Infantil")
                .detalhes("Musical baseado no clássico conto de L. Frank Baum. Espetáculo para toda a família com cenários deslumbrantes e músicas inesquecíveis.")
                .dataHoraInicio(agora.plusDays(10).withHour(15).withMinute(0))
                .dataHoraFim(agora.plusDays(10).withHour(17).withMinute(0))
                .localEvento("Teatro Infantil")
                .categoria("Teatro")
                .capacidadeMaxima(400)
                .precoIngresso(new BigDecimal("45.00"))
                .ativo(true)
                .build(),

            Event.builder()
                .nome("Show de Standup - Noite de Comédia")
                .detalhes("Comediante renomado apresenta seu novo show de stand-up. Piadas sobre relacionamentos, trabalho e a vida moderna. Garantia de risadas!")
                .dataHoraInicio(agora.plusDays(12).withHour(20).withMinute(30))
                .dataHoraFim(agora.plusDays(12).withHour(22).withMinute(30))
                .localEvento("Casa de Shows")
                .categoria("Stand-up")
                .capacidadeMaxima(250)
                .precoIngresso(new BigDecimal("55.00"))
                .ativo(true)
                .build(),

            Event.builder()
                .nome("Romeu e Julieta - Peça de Teatro")
                .detalhes("A mais famosa história de amor de todos os tempos. Adaptação moderna da obra de Shakespeare com elenco jovem e talentoso.")
                .dataHoraInicio(agora.plusDays(25).withHour(19).withMinute(0))
                .dataHoraFim(agora.plusDays(25).withHour(21).withMinute(30))
                .localEvento("Teatro Nacional")
                .categoria("Teatro")
                .capacidadeMaxima(600)
                .precoIngresso(new BigDecimal("90.00"))
                .ativo(true)
                .build(),

            Event.builder()
                .nome("Festival de Jazz")
                .detalhes("Noite especial com os melhores músicos de jazz da cidade. Improvisação, swing e muito estilo. Venha se encantar com o melhor do jazz!")
                .dataHoraInicio(agora.plusDays(18).withHour(20).withMinute(0))
                .dataHoraFim(agora.plusDays(18).withHour(23).withMinute(0))
                .localEvento("Jazz Club")
                .categoria("Música")
                .capacidadeMaxima(200)
                .precoIngresso(new BigDecimal("70.00"))
                .ativo(true)
                .build()
        );

        eventRepository.saveAll(eventos);
        log.info("{} eventos criados com sucesso!", eventos.size());
    }
}

