# Fase de construcción - Compila la aplicación
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copia los archivos de Maven primero (para mejor caching)
COPY pom.xml .
# Descarga las dependencias
RUN mvn dependency:go-offline

# Copia el código fuente
COPY src ./src

# Compila y empaqueta la aplicación
RUN mvn clean package -DskipTests

# Fase de ejecución - Imagen liviana para producción
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copia el JAR desde la fase de construcción
COPY --from=builder /app/target/*.jar app.jar

# Puerto que expone Spring Boot internamente
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]