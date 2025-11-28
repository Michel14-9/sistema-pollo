# Usa una imagen base de Java (JRE)
FROM eclipse-temurin:21-jre-alpine

# Argumento para el archivo JAR
ARG JAR_FILE=target/sistema-apollo-0.0.1-SNAPSHOT.jar 

# Copia el JAR compilado
COPY ${JAR_FILE} /app.jar

# Puerto que expone Spring Boot internamente
EXPOSE 8080

# Comando de inicio
ENTRYPOINT ["java", "-jar", "/app.jar"]