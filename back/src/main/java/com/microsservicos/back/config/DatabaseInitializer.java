package com.microsservicos.back.config;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

@Slf4j
@Configuration
@Order(1) // Executa antes de outros componentes
public class DatabaseInitializer implements InitializingBean {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Override
    public void afterPropertiesSet() {
        createDatabaseAndRunFlyway();
    }

    public void createDatabaseAndRunFlyway() {
        try {
            // Extrai o nome do banco da URL
            String dbName = extractDatabaseName(datasourceUrl);
            String baseUrl = datasourceUrl.replace("/" + dbName, "/postgres");

            log.info("Verificando se o banco de dados '{}' existe...", dbName);

            // Conecta ao banco 'postgres' (que sempre existe)
            try (Connection conn = DriverManager.getConnection(baseUrl, username, password);
                 Statement stmt = conn.createStatement()) {

                // Verifica se o banco existe
                String checkDbQuery = String.format(
                    "SELECT 1 FROM pg_database WHERE datname = '%s'", dbName
                );

                boolean dbExists = stmt.executeQuery(checkDbQuery).next();

                if (!dbExists) {
                    log.info("Banco de dados '{}' não existe. Criando...", dbName);
                    // Cria o banco de dados
                    String createDbQuery = String.format("CREATE DATABASE %s", dbName);
                    stmt.executeUpdate(createDbQuery);
                    log.info("Banco de dados '{}' criado com sucesso!", dbName);
                } else {
                    log.info("Banco de dados '{}' já existe.", dbName);
                }
            }

            // Agora executa o Flyway manualmente
            log.info("Executando migrações Flyway...");
            Flyway flyway = Flyway.configure()
                    .dataSource(datasourceUrl, username, password)
                    .locations("classpath:db/migration")
                    .baselineOnMigrate(true)
                    .load();
            flyway.migrate();
            log.info("Migrações Flyway executadas com sucesso!");

        } catch (Exception e) {
            log.error("Erro ao inicializar banco de dados: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao inicializar banco de dados", e);
        }
    }

    private String extractDatabaseName(String url) {
        // Extrai o nome do banco da URL jdbc:postgresql://host:port/dbname
        int lastSlash = url.lastIndexOf('/');
        if (lastSlash != -1) {
            String dbPart = url.substring(lastSlash + 1);
            // Remove parâmetros de query se existirem
            int questionMark = dbPart.indexOf('?');
            if (questionMark != -1) {
                return dbPart.substring(0, questionMark);
            }
            return dbPart;
        }
        throw new IllegalArgumentException("URL do banco de dados inválida: " + url);
    }
}

