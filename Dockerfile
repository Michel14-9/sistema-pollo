# Usa una imagen base de Java (JRE) ligera y segura para la ejecución
# eclipse-temurin:21-jre-alpine es una buena opción para producción
FROM eclipse-temurin:21-jre-alpine

# Define el argumento JAR_FILE para que Docker sepa qué archivo copiar
# Asume que ya ejecutaste 'mvn clean package' y el JAR está en target/
ARG JAR_FILE=target/sistema-apollo-0.0.1-SNAPSHOT.jar 

# Si tu JAR tiene otro nombre, por favor ajusta la línea ARG o el nombre del archivo.

# Copia el JAR generado (tu aplicación) al contenedor y lo renombra a app.jar
COPY ${JAR_FILE} /app.jar

# Define el puerto que tu aplicación Spring Boot usará (por defecto 8080)
EXPOSE 8080

# Comando para ejecutar la aplicación cuando se inicia el contenedor
ENTRYPOINT ["java", "-jar", "/app.jar"]